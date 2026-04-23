import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => navigate(user?.role === "admin" ? "/admin" : "/events")}>
        <span className="nav-logo-icon">⬡</span>
        <span className="nav-logo-text">EVENTSPHERE</span>
      </div>

      <div className="nav-links">
        {user?.role === "admin" && (
          <button
            className={`nav-link ${isActive("/admin") ? "active" : ""}`}
            onClick={() => navigate("/admin")}
          >
            Dashboard
          </button>
        )}
        <button
          className={`nav-link ${isActive("/events") ? "active" : ""}`}
          onClick={() => navigate("/events")}
        >
          Events
        </button>
        {user?.role !== "admin" && (
          <button
            className={`nav-link ${isActive("/bookings") ? "active" : ""}`}
            onClick={() => navigate("/bookings")}
          >
            My Bookings
          </button>
        )}
      </div>

      <div className="nav-right">
        {user && (
          <>
            <div className="nav-user">
              <span className="nav-avatar">{user.username[0].toUpperCase()}</span>
              <span className="nav-username">{user.username}</span>
              {user.role === "admin" && <span className="nav-role-badge">ADMIN</span>}
            </div>
            <button className="nav-logout" onClick={handleLogout}>Sign Out</button>
          </>
        )}
      </div>
    </nav>
  );
}
