import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.database import Base, get_db
from main import app

# ── In-memory test DB ──────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_event_booking.db"

engine_test = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────────────
def create_test_event(total_seats=5):
    resp = client.post("/events", json={
        "name": "Test Concert",
        "description": "A great show",
        "location": "City Hall",
        "total_seats": total_seats,
        "date": "2025-12-31T20:00:00",
    })
    assert resp.status_code == 201
    return resp.json()


def get_available_seat(event_id):
    seats = client.get(f"/events/{event_id}/seats").json()
    for s in seats:
        if s["status"] == "AVAILABLE":
            return s
    return None


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_successful_booking():
    event = create_test_event()
    event_id = event["id"]
    seat = get_available_seat(event_id)
    assert seat is not None

    resp = client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Alice",
        "mobile_number": "9876543210",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "BOOKED"
    assert data["user_name"] == "Alice"
    assert data["seat_number"] == seat["seat_number"]
    assert data["event_name"] == "Test Concert"


def test_booking_already_booked_seat():
    event = create_test_event()
    event_id = event["id"]
    seat = get_available_seat(event_id)

    # First booking should succeed
    client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Alice",
        "mobile_number": "9876543210",
    })

    # Second booking of same seat should fail with 409
    resp = client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Bob",
        "mobile_number": "1234567890",
    })
    assert resp.status_code == 409
    assert "already booked" in resp.json()["detail"].lower()


def test_cancellation_updates_status():
    event = create_test_event()
    event_id = event["id"]
    seat = get_available_seat(event_id)

    # Book the seat
    booking = client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Charlie",
        "mobile_number": "5555555555",
    }).json()
    booking_id = booking["id"]

    # Cancel the booking
    resp = client.delete(f"/bookings/{booking_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "CANCELLED"

    # Verify the seat is now available again
    seats = client.get(f"/events/{event_id}/seats").json()
    seat_after = next(s for s in seats if s["id"] == seat["id"])
    assert seat_after["status"] == "AVAILABLE"

    # Verify history still contains the cancelled booking
    history = client.get(f"/bookings/Charlie").json()
    assert any(b["id"] == booking_id and b["status"] == "CANCELLED" for b in history)


def test_double_cancellation_fails():
    event = create_test_event()
    event_id = event["id"]
    seat = get_available_seat(event_id)

    booking = client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Dave",
        "mobile_number": "1111111111",
    }).json()
    booking_id = booking["id"]

    client.delete(f"/bookings/{booking_id}")
    resp = client.delete(f"/bookings/{booking_id}")
    assert resp.status_code == 409


def test_event_available_seats_decrements():
    event = create_test_event(total_seats=3)
    event_id = event["id"]
    assert event["available_seats"] == 3

    seat = get_available_seat(event_id)
    client.post(f"/events/{event_id}/book", json={
        "seat_id": seat["id"],
        "user_name": "Eve",
        "mobile_number": "2222222222",
    })

    updated_event = client.get(f"/events/{event_id}").json()
    assert updated_event["available_seats"] == 2


def test_booking_history_sorted_by_date():
    event = create_test_event(total_seats=3)
    event_id = event["id"]
    seats = [s for s in client.get(f"/events/{event_id}/seats").json() if s["status"] == "AVAILABLE"]

    for s in seats[:2]:
        client.post(f"/events/{event_id}/book", json={
            "seat_id": s["id"],
            "user_name": "Frank",
            "mobile_number": "3333333333",
        })

    history = client.get("/bookings/Frank").json()
    assert len(history) == 2
    # Latest booking first
    assert history[0]["booking_date"] >= history[1]["booking_date"]
