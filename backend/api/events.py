from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from schemas.schemas import EventCreate, EventResponse, SeatResponse, RecommendedEventResponse
from services import event_service
from services.ml_service import get_recommendations

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=201)
def create_event(data: EventCreate, db: Session = Depends(get_db)):
    """Create a new event (admin). Seats are auto-generated."""
    return event_service.create_event(db, data)


@router.get("", response_model=List[EventResponse])
def list_events(search: str = Query("", description="Filter by event name"), db: Session = Depends(get_db)):
    """List all events, optionally filtered by name."""
    return event_service.get_events(db, search)


# ── IMPORTANT: /recommendations MUST be declared before /{event_id} ───────────
@router.get("/recommendations", response_model=List[RecommendedEventResponse])
def get_event_recommendations(
    user_id: Optional[int] = Query(None, description="User ID for personalised recommendations"),
    top_n: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    ML-powered event recommendations.
    Scores events by booking velocity, fill ratio, urgency, and TF-IDF content similarity.
    """
    results = get_recommendations(db, user_id=user_id, top_n=top_n)
    output = []
    for r in results:
        ev = r["event"]
        output.append({
            "id": ev.id,
            "name": ev.name,
            "description": ev.description,
            "location": ev.location,
            "total_seats": ev.total_seats,
            "available_seats": ev.available_seats,
            "date": ev.date,
            "created_at": ev.created_at,
            "recommendation_score": r["score"],
            "recommendation_reason": r["reason"],
        })
    return output


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a single event by ID."""
    return event_service.get_event(db, event_id)


@router.get("/{event_id}/seats", response_model=List[SeatResponse])
def get_seats(event_id: int, db: Session = Depends(get_db)):
    """Get all seats for an event."""
    return event_service.get_seats(db, event_id)
