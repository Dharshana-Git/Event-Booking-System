from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db.database import Base


class SeatStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"


class BookingStatus(str, enum.Enum):
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, nullable=False, index=True)
    email           = Column(String, unique=True, nullable=False, index=True)
    mobile_number   = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="user", nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("available_seats >= 0", name="ck_events_available_seats_non_negative"),
    )

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False, index=True)
    description     = Column(String, nullable=True)
    location        = Column(String, nullable=False)
    total_seats     = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    date            = Column(DateTime, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    seats    = relationship("Seat", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event")


class Seat(Base):
    __tablename__ = "seats"

    id          = Column(Integer, primary_key=True, index=True)
    event_id    = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(String, nullable=False)
    status      = Column(SAEnum(SeatStatus), default=SeatStatus.AVAILABLE, nullable=False)

    event    = relationship("Event", back_populates="seats")
    bookings = relationship("Booking", back_populates="seat")


class Booking(Base):
    __tablename__ = "bookings"

    id           = Column(Integer, primary_key=True, index=True)
    event_id     = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    seat_id      = Column(Integer, ForeignKey("seats.id",  ondelete="CASCADE"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    user_name    = Column(String, nullable=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    status       = Column(SAEnum(BookingStatus), default=BookingStatus.BOOKED, nullable=False)

    event = relationship("Event", back_populates="bookings")
    seat  = relationship("Seat",  back_populates="bookings")
    user  = relationship("User",  back_populates="bookings")
