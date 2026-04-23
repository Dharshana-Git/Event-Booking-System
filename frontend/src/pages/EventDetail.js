import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvent, getSeats, bookSeats } from "../api/client";
import Navbar from "../components/Navbar";
import SeatViewer3D from "../components/SeatViewer3D";
import "./EventDetail.css";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);   // array of seat objects
  const [quantity, setQuantity] = useState(1);              // how many to pick
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.role === "admin") { navigate("/admin"); return; }
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ev, st] = await Promise.all([getEvent(id), getSeats(id)]);
      setEvent(ev);
      setSeats(st);
      setSelectedSeats([]);
    } catch {
      navigate("/events");
    }
    setLoading(false);
  };

  const handleSeatClick = (seat) => {
    setSelectedSeats((prev) => {
      const already = prev.find((s) => s.id === seat.id);
      if (already) {
        // Deselect
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= quantity) {
        // Replace oldest selection
        return [...prev.slice(1), seat];
      }
      return [...prev, seat];
    });
    setNotification(null);
  };

  const handleBook = async () => {
    if (selectedSeats.length === 0) return;
    setBooking(true);
    try {
      const result = await bookSeats(
        id,
        selectedSeats.map((s) => s.id),
        user.user_id
      );
      setNotification({
        type: "success",
        title: `🎉 ${result.bookings.length} Seat(s) Booked!`,
        text: `Seats: ${result.seats_booked.join(", ")} for "${result.event_name}". An SMS confirmation has been sent to your phone.`,
      });
      setSelectedSeats([]);
      await loadData();
    } catch (err) {
      setNotification({
        type: "error",
        title: "Booking Failed",
        text: err.response?.data?.detail || "Something went wrong.",
      });
    }
    setBooking(false);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

  if (loading) return (
    <>
      <Navbar />
      <div className="detail-loading">
        <div className="dot-loader"><span /><span /><span /></div>
      </div>
    </>
  );

  const booked = seats.filter(s => s.status === "BOOKED").length;
  const available = seats.filter(s => s.status === "AVAILABLE").length;

  return (
    <>
      <Navbar />
      <div className="detail-page">
        {/* Header */}
        <div className="detail-hero">
          <button className="back-btn" onClick={() => navigate("/events")}>← Back</button>
          <div className="detail-info">
            <h1>{event.name}</h1>
            <div className="detail-meta">
              <span>📍 {event.location}</span>
              <span>🗓 {formatDate(event.date)}</span>
              <span>💺 {available} seats left</span>
            </div>
            {event.description && <p className="detail-desc">{event.description}</p>}
          </div>
          <div className="detail-stats">
            <div className="stat-item">
              <div className="stat-num available-num">{available}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-num booked-num">{booked}</div>
              <div className="stat-label">Booked</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-num">{event.total_seats}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`notif notif-${notification.type}`}>
            <div className="notif-title">{notification.title}</div>
            <div className="notif-text">{notification.text}</div>
            <button className="notif-close" onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        <div className="detail-body">
          {/* 3D Viewer */}
          <div className="viewer-section">
            <div className="viewer-header">
              <h2>Interactive Seat Map</h2>
              <div className="legend">
                <span className="legend-item available">● Available</span>
                <span className="legend-item booked">● Booked</span>
                <span className="legend-item selected">● Selected</span>
              </div>
            </div>
            <div className="viewer-hint">
              Drag to rotate · Scroll to zoom · Click green seats to select
            </div>
            <Suspense fallback={<div className="canvas-loading">Loading 3D View…</div>}>
              <SeatViewer3D
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
              />
            </Suspense>
          </div>

          {/* Booking Panel */}
          <div className="booking-panel">
            <h2>Book Seats</h2>

            {/* Quantity Selector */}
            <div className="qty-section">
              <label className="qty-label">How many seats?</label>
              <div className="qty-controls">
                <button
                  className="qty-btn"
                  onClick={() => { setQuantity(q => Math.max(1, q - 1)); setSelectedSeats([]); }}
                  disabled={quantity <= 1}
                >−</button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => { setQuantity(q => Math.min(available, q + 1)); setSelectedSeats([]); }}
                  disabled={quantity >= available || quantity >= 10}
                >+</button>
              </div>
              <div className="qty-hint">Select up to {quantity} seat{quantity > 1 ? "s" : ""} on the map</div>
            </div>

            {/* Selected Seats Display */}
            <div className="selected-seats-display">
              {selectedSeats.length === 0 ? (
                <div className="select-hint">
                  Click <span style={{ color: "#22c55e" }}>green</span> seats on the map
                </div>
              ) : (
                <div className="selected-tags">
                  {selectedSeats.map(s => (
                    <span key={s.id} className="seat-tag">
                      {s.seat_number}
                      <button onClick={() => setSelectedSeats(prev => prev.filter(x => x.id !== s.id))}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="selection-count">
                {selectedSeats.length} / {quantity} selected
              </div>
            </div>

            <button
              className="book-btn"
              onClick={handleBook}
              disabled={selectedSeats.length === 0 || booking}
            >
              {booking
                ? "Processing…"
                : selectedSeats.length > 0
                ? `Confirm ${selectedSeats.length} Seat${selectedSeats.length > 1 ? "s" : ""}`
                : "Select Seats First"}
            </button>

            <div className="sms-note">
              📱 Booking confirmation will be sent via SMS to your registered number.
            </div>

            <button className="history-link" onClick={() => navigate("/bookings")}>
              View My Booking History →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
