import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createEvent, getEvents } from "../api/client";
import Navbar from "../components/Navbar";
import "./Admin.css";

const EMPTY_FORM = {
  name: "", description: "", location: "",
  total_seats: "", date: "",
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState(null);   // { type: 'success'|'error', text }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch {}
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await createEvent({
        ...form,
        total_seats: parseInt(form.total_seats),
        date: new Date(form.date).toISOString(),
      });
      setMsg({ type: "success", text: `Event "${form.name}" created successfully!` });
      setForm(EMPTY_FORM);
      loadEvents();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.detail || "Failed to create event." });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <Navbar />
      <div className="admin-page">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Create and manage events</p>
          </div>
          <div className="stat-badge">{events.length} Events</div>
        </div>

        <div className="admin-grid">
          {/* ── Create Event Form ── */}
          <section className="create-card">
            <h2>Create New Event</h2>
            {msg && (
              <div className={`alert alert-${msg.type}`}>{msg.text}</div>
            )}
            <form onSubmit={handleSubmit} className="create-form">
              <div className="field">
                <label>Event Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Summer Music Fest" />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Tell attendees what to expect…" rows={3} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Location *</label>
                  <input name="location" value={form.location} onChange={handleChange} required placeholder="City Hall, Chennai" />
                </div>
                <div className="field">
                  <label>Total Seats *</label>
                  <input name="total_seats" type="number" min="1" max="500" value={form.total_seats} onChange={handleChange} required placeholder="50" />
                </div>
              </div>
              <div className="field">
                <label>Date &amp; Time *</label>
                <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
              </div>
              <button type="submit" className="create-btn" disabled={loading}>
                {loading ? "Creating…" : "Create Event ✦"}
              </button>
            </form>
          </section>

          {/* ── Events List ── */}
          <section className="events-list-section">
            <h2>All Events <span className="count-tag">{events.length}</span></h2>
            {events.length === 0 ? (
              <div className="empty-state">No events yet. Create one!</div>
            ) : (
              <div className="admin-event-list">
                {events.map((ev) => (
                  <div key={ev.id} className="admin-event-card" onClick={() => navigate(`/events/${ev.id}`)}>
                    <div className="aec-name">{ev.name}</div>
                    <div className="aec-meta">
                      <span>📍 {ev.location}</span>
                      <span>🗓 {formatDate(ev.date)}</span>
                    </div>
                    <div className="aec-seats">
                      <span className="seat-avail">{ev.available_seats} available</span>
                      <span className="seat-total">/ {ev.total_seats} total</span>
                    </div>
                    <div className="seat-bar">
                      <div
                        className="seat-bar-fill"
                        style={{ width: `${((ev.total_seats - ev.available_seats) / ev.total_seats) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
