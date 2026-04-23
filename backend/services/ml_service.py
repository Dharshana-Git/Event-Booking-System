"""
ML-based event recommendation engine.

Algorithm: Hybrid scoring using:
  1. Booking velocity  — how fast seats are being filled (recent 7-day booking rate)
  2. Fill ratio        — percentage of seats already booked (popularity signal)
  3. Urgency score     — days until event (nearer = more urgent)
  4. TF-IDF similarity — if user has past bookings, recommend similar event names/locations

The final score is a weighted sum normalised to [0, 1].
"""
import math
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.models import Event, Booking, BookingStatus

logger = logging.getLogger(__name__)


def _booking_velocity(event: Event, db: Session) -> float:
    """Bookings made in the last 7 days for this event, normalised by total seats."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    recent = (
        db.query(Booking)
        .filter(
            Booking.event_id == event.id,
            Booking.status == BookingStatus.BOOKED,
            Booking.booking_date >= cutoff,
        )
        .count()
    )
    return min(recent / max(event.total_seats, 1), 1.0)


def _fill_ratio(event: Event) -> float:
    """Fraction of seats already taken."""
    booked = event.total_seats - event.available_seats
    return booked / max(event.total_seats, 1)


def _urgency_score(event: Event) -> float:
    """
    Events happening soon score higher.
    Uses a 365-day window so newly created events still get a score.
    """
    now = datetime.utcnow()
    delta_days = (event.date - now).total_seconds() / 86400
    if delta_days <= 0 or delta_days > 365:
        return 0.0
    # Score peaks near 1.0 for imminent events, gradually falls off
    return max(0.0, 1.0 - (delta_days / 365))


def _tfidf_similarity(event: Event, user_history_text: str) -> float:
    """
    Simple cosine similarity between event tokens and user's past event tokens.
    Falls back to 0 if sklearn unavailable or no history.
    """
    if not user_history_text:
        return 0.0
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        event_text = f"{event.name} {event.location} {event.description or ''}"
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf = vectorizer.fit_transform([event_text, user_history_text])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(score)
    except Exception as e:
        logger.warning(f"TF-IDF similarity failed: {e}")
        return 0.0


def _reason(velocity: float, fill: float, urgency: float, similarity: float) -> str:
    reasons = []
    if velocity > 0.10:
        reasons.append("booking fast")
    if fill > 0.5:
        reasons.append(f"{int(fill*100)}% sold")
    if urgency > 0.5:
        reasons.append("happening soon")
    elif urgency > 0.2:
        reasons.append("upcoming event")
    if similarity > 0.2:
        reasons.append("matches your interests")
    if not reasons:
        reasons.append("new event")
    return ", ".join(reasons).capitalize()


def get_recommendations(db: Session, user_id: int | None = None, top_n: int = 5) -> list[dict]:
    """
    Return top_n upcoming events with recommendation scores and reasons.
    If user_id provided, personalise using their booking history.
    """
    now = datetime.utcnow()
    events = (
        db.query(Event)
        .filter(Event.date > now)   # only future events; no seat filter so list is never empty
        .all()
    )

    if not events:
        return []

    # Build user history text for TF-IDF personalisation
    history_text = ""
    if user_id:
        past = (
            db.query(Booking)
            .filter(Booking.user_id == user_id, Booking.status == BookingStatus.BOOKED)
            .all()
        )
        history_text = " ".join(
            f"{b.event.name} {b.event.location}"
            for b in past
            if b.event
        )

    scored = []
    for ev in events:
        velocity   = _booking_velocity(ev, db)
        fill       = _fill_ratio(ev)
        urgency    = _urgency_score(ev)
        similarity = _tfidf_similarity(ev, history_text)

        # Weighted combination — add a small base so even brand-new events appear
        score = (
            0.35 * velocity +
            0.25 * fill +
            0.20 * urgency +
            0.20 * similarity +
            0.05  # base floor so all upcoming events qualify
        )
        scored.append({
            "event": ev,
            "score": round(score, 4),
            "reason": _reason(velocity, fill, urgency, similarity),
        })

    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]
