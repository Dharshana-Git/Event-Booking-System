# EventSphere Python SDK — Sample Usage
# Generated via: openapi-generator-cli generate -i http://localhost:8000/openapi.json -g python -o event_sdk

# ─────────────────────────────────────────────────────────────
# STEP 1 — Generate the SDK (run once, with backend running)
# ─────────────────────────────────────────────────────────────
# npm install @openapitools/openapi-generator-cli -g
# openapi-generator-cli generate \
#   -i http://localhost:8000/openapi.json \
#   -g python \
#   -o event_sdk \
#   --additional-properties=packageName=event_sdk,projectName=EventSphere

# ─────────────────────────────────────────────────────────────
# STEP 2 — Install the generated SDK
# ─────────────────────────────────────────────────────────────
# cd event_sdk && pip install -e .

# ─────────────────────────────────────────────────────────────
# STEP 3 — Use the SDK in your scripts
# ─────────────────────────────────────────────────────────────

import event_sdk
from event_sdk.api import events_api, bookings_api, auth_api
from event_sdk.model.event_create import EventCreate
from event_sdk.model.booking_create import BookingCreate
from event_sdk.model.login_request import LoginRequest
from datetime import datetime

# Configure host
configuration = event_sdk.Configuration(host="http://localhost:8000")

with event_sdk.ApiClient(configuration) as api_client:

    # ── Auth ──────────────────────────────────────────────────
    auth = auth_api.AuthApi(api_client)
    response = auth.login_auth_login_post(
        LoginRequest(username="alice", password="alice123")
    )
    print(f"Logged in as: {response.username} ({response.role})")

    # ── Create Event (admin) ──────────────────────────────────
    events = events_api.EventsApi(api_client)
    new_event = events.create_event_events_post(
        EventCreate(
            name="Tech Summit 2025",
            description="Annual developer conference",
            location="Chennai Trade Centre",
            total_seats=30,
            date=datetime(2025, 11, 15, 9, 0, 0),
        )
    )
    print(f"Created event: {new_event.name} (ID: {new_event.id})")

    # ── List Events ───────────────────────────────────────────
    all_events = events.list_events_events_get(search="Tech")
    for ev in all_events:
        print(f"  [{ev.id}] {ev.name} — {ev.available_seats}/{ev.total_seats} seats")

    # ── Get Seats for an Event ────────────────────────────────
    seats = events.get_seats_events_event_id_seats_get(event_id=new_event.id)
    available = [s for s in seats if s.status == "AVAILABLE"]
    print(f"Available seats: {[s.seat_number for s in available[:5]]}")

    # ── Book a Seat ───────────────────────────────────────────
    bookings = bookings_api.BookingsApi(api_client)
    if available:
        booking = bookings.book_seat_events_event_id_book_post(
            event_id=new_event.id,
            booking_create=BookingCreate(
                seat_id=available[0].id,
                user_name="alice",
                mobile_number="9876543210",
            ),
        )
        print(f"Booked seat {booking.seat_number} — Booking #{booking.id}")

        # ── Cancel the Booking ────────────────────────────────
        cancelled = bookings.cancel_booking_bookings_booking_id_delete(
            booking_id=booking.id
        )
        print(f"Cancelled booking #{cancelled.id} — Status: {cancelled.status}")

    # ── Booking History ───────────────────────────────────────
    history = bookings.get_user_bookings_bookings_user_name_get(user_name="alice")
    print(f"\nBooking history for alice ({len(history)} records):")
    for b in history:
        print(f"  #{b.id} | {b.event_name} | Seat {b.seat_number} | {b.status}")
