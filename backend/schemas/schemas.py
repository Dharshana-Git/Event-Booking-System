from pydantic import BaseModel, field_validator, EmailStr
from datetime import datetime
from typing import Optional, List
from models.models import SeatStatus, BookingStatus


# ── User / Auth Schemas ────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    username: str
    email: str
    mobile_number: str
    password: str

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v):
        digits = v.replace("+", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or len(digits) < 7:
            raise ValueError("Invalid mobile number")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    role: str
    username: str
    user_id: int
    mobile_number: str
    message: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    mobile_number: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event Schemas ──────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: str
    total_seats: int
    date: datetime

    @field_validator("total_seats")
    @classmethod
    def seats_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("total_seats must be a positive integer")
        return v


class EventResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: str
    total_seats: int
    available_seats: int
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendedEventResponse(EventResponse):
    recommendation_score: float
    recommendation_reason: str


# ── Seat Schemas ───────────────────────────────────────────────────────────────

class SeatResponse(BaseModel):
    id: int
    event_id: int
    seat_number: str
    status: SeatStatus

    class Config:
        from_attributes = True


# ── Booking Schemas ────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    """Book multiple seats in one request."""
    seat_ids: List[int]          # list of seat IDs the user chose
    user_id: int

    @field_validator("seat_ids")
    @classmethod
    def at_least_one(cls, v):
        if not v:
            raise ValueError("Select at least one seat")
        if len(v) > 10:
            raise ValueError("Cannot book more than 10 seats at once")
        return v


class BookingResponse(BaseModel):
    id: int
    event_id: int
    seat_id: int
    user_id: int
    booking_date: datetime
    status: BookingStatus
    seat_number: Optional[str] = None
    event_name: Optional[str] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


class MultiBookingResponse(BaseModel):
    """Returned when booking multiple seats at once."""
    bookings: List[BookingResponse]
    message: str
    seats_booked: List[str]   # seat numbers
    event_name: str

