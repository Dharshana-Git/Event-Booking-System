from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.models import Booking, Seat, Event, User, SeatStatus, BookingStatus
from schemas.schemas import BookingCreate
from services.sms_service import send_booking_confirmation, send_cancellation_confirmation


def create_bookings(db: Session, event_id: int, data: BookingCreate) -> list[Booking]:
    """Book multiple seats atomically. All succeed or all fail."""

    # Validate event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Validate user (must not be admin)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot book tickets")

    # Validate seat count
    if len(data.seat_ids) > event.available_seats:
        raise HTTPException(
            status_code=409,
            detail=f"Only {event.available_seats} seats available, requested {len(data.seat_ids)}",
        )

    # Fetch & validate all seats before making any changes
    seats = []
    for seat_id in data.seat_ids:
        seat = db.query(Seat).filter(Seat.id == seat_id, Seat.event_id == event_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail=f"Seat ID {seat_id} not found for this event")
        if seat.status == SeatStatus.BOOKED:
            raise HTTPException(status_code=409, detail=f"Seat {seat.seat_number} is already booked")
        seats.append(seat)

    # Perform all bookings
    bookings = []
    for seat in seats:
        seat.status = SeatStatus.BOOKED
        booking = Booking(
            event_id=event_id,
            seat_id=seat.id,
            user_id=user.id,
            user_name=user.username,   # PDF schema compatibility
            status=BookingStatus.BOOKED,
        )
        db.add(booking)
        bookings.append(booking)

    event.available_seats -= len(seats)
    db.commit()
    for b in bookings:
        db.refresh(b)

    # Send SMS confirmation
    seat_numbers = [s.seat_number for s in seats]
    booking_ids  = [b.id for b in bookings]
    send_booking_confirmation(user.mobile_number, user.username, event.name, seat_numbers, booking_ids)

    return bookings


def cancel_booking(db: Session, booking_id: int, requesting_user_id: int) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only the owner can cancel their own booking
    if booking.user_id != requesting_user_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=409, detail="Booking is already cancelled")

    seat  = db.query(Seat).filter(Seat.id == booking.seat_id).first()
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    user  = db.query(User).filter(User.id == booking.user_id).first()

    booking.status = BookingStatus.CANCELLED
    if seat:
        seat.status = SeatStatus.AVAILABLE
    if event:
        event.available_seats += 1

    db.commit()
    db.refresh(booking)

    # Send SMS cancellation notice
    if user and event and seat:
        send_cancellation_confirmation(
            user.mobile_number, user.username,
            event.name, seat.seat_number, booking.id,
        )

    return booking


def get_user_bookings(db: Session, user_id: int) -> list[Booking]:
    """Return only this user's own bookings, latest first."""
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.booking_date.desc())
        .all()
    )
