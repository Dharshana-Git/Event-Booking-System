from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.models import Event, Seat, SeatStatus
from schemas.schemas import EventCreate
import math


def _generate_seat_number(index: int) -> str:
    """Convert a zero-based index to seat label like A1, A2, …, B1, …"""
    row = chr(ord("A") + (index // 10))
    col = (index % 10) + 1
    return f"{row}{col}"


def create_event(db: Session, data: EventCreate) -> Event:
    event = Event(
        name=data.name,
        description=data.description,
        location=data.location,
        total_seats=data.total_seats,
        available_seats=data.total_seats,
        date=data.date,
    )
    db.add(event)
    db.flush()  # get event.id without committing

    seats = [
        Seat(
            event_id=event.id,
            seat_number=_generate_seat_number(i),
            status=SeatStatus.AVAILABLE,
        )
        for i in range(data.total_seats)
    ]
    db.bulk_save_objects(seats)
    db.commit()
    db.refresh(event)
    return event


def get_events(db: Session, search: str = "") -> list[Event]:
    query = db.query(Event)
    if search:
        query = query.filter(Event.name.ilike(f"%{search}%"))
    return query.order_by(Event.date.asc()).all()


def get_event(db: Session, event_id: int) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


def get_seats(db: Session, event_id: int) -> list[Seat]:
    get_event(db, event_id)  # validate event exists
    return (
        db.query(Seat)
        .filter(Seat.event_id == event_id)
        .order_by(Seat.seat_number.asc())
        .all()
    )
