import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserBookings, cancelBooking } from "../api/client";
import Navbar from "../components/Navbar";
import "./Bookings.css";

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.role === "admin") { navigate("/admin"); return; }
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getUserBookings(user.user_id);
      setBookings(data);
    } catch {}
    setLoading(false);
  };

  const handleCancel = async (bookingId, eventName, seatNumber) => {
    if (!window.confirm(`Cancel booking for Seat ${seatNumber} at "${eventName}"?`)) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, user.user_id);
      setNotification({
        type: "info",
        text: `Seat ${seatNumber} at "${eventName}" cancelled. SMS sent to your phone.`,
      });
      await loadBookings();
    } catch (err) {
      setNotification({
        type: "error",
        text: err.response?.data?.detail || "Failed to cancel booking.",
      });
    }
    setCancellingId(null);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const activeCount = bookings.filter(b => b.status === "BOOKED").length;

  // Group bookings by event for better readability
  const grouped = bookings.reduce((acc, b) => {
    const key = b.event_name || "Unknown Event";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="bookings-page">
        <div className="bookings-hero">
          <div>
            <h1>My Bookings</h1>
            <p>Your personal booking history — private to your account</p>
          </div>
          <div className="bookings-stats">
            <div className="bs-item">
              <span className="bs-num active-num">{activeCount}</span>
              <span className="bs-label">Active</span>
            </div>
            <div className="bs-divider" />
            <div className="bs-item">
              <span className="bs-num">{bookings.length}</span>
              <span className="bs-label">Total</span>
            </div>
          </div>
        </div>

        {notification && (
          <div className={`notif notif-${notification.type}`}>
            {notification.text}
            <button className="notif-close" onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        <div className="bookings-container">
          {loading ? (
            <div className="loader-wrap">
              <div className="dot-loader"><span /><span /><span /></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings">
              <div className="nb-icon">🎫</div>
              <div className="nb-title">No bookings yet</div>
              <div className="nb-sub">Browse events and book your first seat!</div>
              <button className="nb-cta" onClick={() => navigate("/events")}>
                Explore Events →
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {Object.entries(grouped).map(([eventName, evBookings]) => (
                <div key={eventName} className="booking-group">
                  <div className="group-header">
                    <span className="group-event-name">{eventName}</span>
                    <span className="group-count">{evBookings.length} seat{evBookings.length > 1 ? "s" : ""}</span>
                  </div>
                  {evBookings.map((b) => (
                    <div key={b.id} className={`booking-card ${b.status === "CANCELLED" ? "cancelled" : ""}`}>
                      <div className="bc-left">
                        <div className={`bc-status-dot ${b.status === "BOOKED" ? "active" : "cancelled"}`} />
                      </div>
                      <div className="bc-body">
                        <div className="bc-seat-row">
                          <span className="bc-seat">Seat {b.seat_number}</span>
                          <span className={`bc-badge ${b.status === "BOOKED" ? "badge-booked" : "badge-cancelled"}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="bc-meta">
                          <span>{formatDate(b.booking_date)}</span>
                          <span>·</span>
                          <span>Booking #{b.id}</span>
                        </div>
                      </div>
                      <div className="bc-right">
                        {b.status === "BOOKED" && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancel(b.id, b.event_name, b.seat_number)}
                            disabled={cancellingId === b.id}
                          >
                            {cancellingId === b.id ? "…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

