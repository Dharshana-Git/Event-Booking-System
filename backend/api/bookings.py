from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from schemas.schemas import BookingCreate, BookingResponse, MultiBookingResponse
from services import booking_service
from models.models import Booking

router = APIRouter(tags=["Bookings"])


def _enrich(booking: Booking) -> dict:
    return {
        "id": booking.id,
        "event_id": booking.event_id,
        "seat_id": booking.seat_id,
        "user_id": booking.user_id,
        "booking_date": booking.booking_date,
        "status": booking.status,
        "seat_number": booking.seat.seat_number if booking.seat else None,
        "event_name": booking.event.name if booking.event else None,
        "username": booking.user.username if booking.user else None,
    }


@router.post("/events/{event_id}/book", response_model=MultiBookingResponse, status_code=201)
def book_seats(event_id: int, data: BookingCreate, db: Session = Depends(get_db)):
    """Book one or more seats for an event. Admin accounts are blocked."""
    bookings = booking_service.create_bookings(db, event_id, data)
    enriched = [_enrich(b) for b in bookings]
    event_name = bookings[0].event.name if bookings else ""
    seat_numbers = [b["seat_number"] for b in enriched]
    return MultiBookingResponse(
        bookings=enriched,
        message=f"Successfully booked {len(bookings)} seat(s) for {event_name}",
        seats_booked=seat_numbers,
        event_name=event_name,
    )


@router.delete("/bookings/{booking_id}", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    user_id: int = Query(..., description="ID of the requesting user"),
    db: Session = Depends(get_db),
):
    """Cancel a booking. Only the booking owner can cancel it."""
    booking = booking_service.cancel_booking(db, booking_id, user_id)
    return _enrich(booking)


@router.get("/bookings/user/{user_id}", response_model=List[BookingResponse])
def get_my_bookings(user_id: int, db: Session = Depends(get_db)):
    """Get all bookings belonging to a specific user (isolated per user)."""
    bookings = booking_service.get_user_bookings(db, user_id)
    return [_enrich(b) for b in bookings]

