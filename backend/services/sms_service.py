"""
SMS notification service via Twilio.
If Twilio credentials are not configured, notifications are logged to console only.
"""
import logging
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SMS_ENABLED

logger = logging.getLogger(__name__)


def _get_client():
    if not SMS_ENABLED:
        return None
    try:
        from twilio.rest import Client
        return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        logger.warning(f"Twilio client init failed: {e}")
        return None


def send_sms(to_number: str, message: str) -> bool:
    """
    Send an SMS to the given number.
    Returns True if sent successfully, False otherwise.
    Always normalises the number to E.164 format if missing '+'.
    """
    # Normalise number
    number = to_number.strip()
    if not number.startswith("+"):
        number = "+" + number

    if not SMS_ENABLED:
        logger.info(f"[SMS DISABLED] Would send to {number}:\n{message}")
        return False

    client = _get_client()
    if not client:
        return False

    try:
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=number,
        )
        logger.info(f"SMS sent to {number} — SID: {msg.sid}")
        return True
    except Exception as e:
        logger.error(f"SMS failed to {number}: {e}")
        return False


# ── Pre-built message templates ────────────────────────────────────────────────

def send_booking_confirmation(mobile: str, username: str, event_name: str, seat_numbers: list[str], booking_ids: list[int]):
    seats_str = ", ".join(seat_numbers)
    ids_str   = ", ".join(f"#{b}" for b in booking_ids)
    message = (
        f"Hi {username}! 🎉\n"
        f"Your booking is CONFIRMED.\n"
        f"Event : {event_name}\n"
        f"Seats : {seats_str}\n"
        f"Booking IDs: {ids_str}\n"
        f"Enjoy the event! — EventSphere"
    )
    return send_sms(mobile, message)


def send_cancellation_confirmation(mobile: str, username: str, event_name: str, seat_number: str, booking_id: int):
    message = (
        f"Hi {username},\n"
        f"Your booking has been CANCELLED.\n"
        f"Event : {event_name}\n"
        f"Seat  : {seat_number}\n"
        f"Booking ID: #{booking_id}\n"
        f"We hope to see you at another event! — EventSphere"
    )
    return send_sms(mobile, message)
