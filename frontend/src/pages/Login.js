import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, signup } from "../api/client";
import "./Login.css";

export default function Login() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    username: "", email: "", mobile_number: "", password: "", confirm: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(loginForm.username, loginForm.password);
      signIn({ username: data.username, role: data.role, user_id: data.user_id, mobile_number: data.mobile_number });
      navigate(data.role === "admin" ? "/admin" : "/events");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (signupForm.password !== signupForm.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signup({
        username: signupForm.username,
        email: signupForm.email,
        mobile_number: signupForm.mobile_number,
        password: signupForm.password,
      });
      // Auto-login after signup
      const data = await login(signupForm.username, signupForm.password);
      signIn({ username: data.username, role: data.role, user_id: data.user_id, mobile_number: data.mobile_number });
      navigate("/events");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">EVENTSPHERE</span>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button className={`ltab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>
            Sign In
          </button>
          <button className={`ltab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setError(""); }}>
            Create Account
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {/* ── Login Form ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="field-group">
              <label>Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter your username"
                required autoFocus
              />
            </div>
            <div className="field-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>
            <div className="login-hint">
              Admin: <code>admin / admin123</code>
            </div>
          </form>
        )}

        {/* ── Signup Form ── */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} className="login-form">
            <div className="field-group">
              <label>Username *</label>
              <input
                type="text"
                value={signupForm.username}
                onChange={(e) => setSignupForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Choose a username"
                required autoFocus
              />
            </div>
            <div className="field-group">
              <label>Email *</label>
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field-group">
              <label>Mobile Number * (for SMS notifications)</label>
              <input
                type="tel"
                value={signupForm.mobile_number}
                onChange={(e) => setSignupForm(f => ({ ...f, mobile_number: e.target.value }))}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div className="field-group">
              <label>Password *</label>
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div className="field-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={signupForm.confirm}
                onChange={(e) => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your password"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
