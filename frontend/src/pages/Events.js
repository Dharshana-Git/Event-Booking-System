import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, getRecommendations } from "../api/client";
import Navbar from "../components/Navbar";
import "./Events.css";

function EventCard({ ev, onClick }) {
  const pct = Math.round(
    ((ev.total_seats - ev.available_seats) / ev.total_seats) * 100
  );
  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="event-card" onClick={onClick}>
      <div
        className="ec-header"
        style={{ background: `hsl(${(ev.id * 67) % 360}, 55%, 16%)` }}
      >
        <span className="ec-icon">🎪</span>
        <div className={`ec-status ${ev.available_seats === 0 ? "sold-out" : ""}`}>
          {ev.available_seats === 0 ? "SOLD OUT" : "AVAILABLE"}
        </div>
        {ev.recommendation_score !== undefined && (
          <div className="rec-score-badge">
            🔥 {ev.recommendation_reason}
          </div>
        )}
      </div>
      <div className="ec-body">
        <h3>{ev.name}</h3>
        <div className="ec-meta">
          <span>📍 {ev.location}</span>
          <span>🗓 {formatDate(ev.date)}</span>
        </div>
        {ev.description && <p className="ec-desc">{ev.description}</p>}
        <div className="ec-footer">
          <div className="ec-seats">
            <strong>{ev.available_seats}</strong>
            <span>/ {ev.total_seats} seats left</span>
          </div>
          <div className="ec-bar">
            <div className="ec-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button className="view-btn" disabled={ev.available_seats === 0}>
          {ev.available_seats === 0 ? "Sold Out" : "Select Seats →"}
        </button>
      </div>
    </div>
  );
}

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRec, setLoadingRec] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    loadRecommendations();
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEvents(search);
      setEvents(data);
    } catch {}
    setLoading(false);
  };

  const loadRecommendations = async () => {
    setLoadingRec(true);
    try {
      const data = await getRecommendations(user?.user_id, 4);
      setRecommendations(data);
    } catch {}
    setLoadingRec(false);
  };

  return (
    <>
      <Navbar />
      <div className="events-page">
        <div className="events-hero">
          <h1>Upcoming Events</h1>
          <p>Find and book your perfect seat</p>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        </div>

        <div className="events-container">

          {/* ── ML Recommendations ── */}
          {!search && (
            <section className="rec-section">
              <div className="rec-header">
                <div className="rec-title">
                  <span className="rec-icon">🤖</span>
                  <h2>Recommended For You</h2>
                </div>
                <span className="rec-tag">AI-Powered</span>
              </div>
              <p className="rec-sub">
                Based on booking velocity, fill rate, urgency, and your interest history
              </p>

              {loadingRec ? (
                <div className="loader-wrap">
                  <div className="dot-loader"><span /><span /><span /></div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="rec-empty">No trending events right now — check back soon!</div>
              ) : (
                <div className="rec-grid">
                  {recommendations.map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      onClick={() => navigate(`/events/${ev.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── All Events ── */}
          <section>
            <h2 className="section-title">
              {search ? `Results for "${search}"` : "All Events"}
            </h2>
            {loading ? (
              <div className="loader-wrap">
                <div className="dot-loader"><span /><span /><span /></div>
              </div>
            ) : events.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">🎭</div>
                <div>No events found{search ? ` for "${search}"` : ""}.</div>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    onClick={() => navigate(`/events/${ev.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

