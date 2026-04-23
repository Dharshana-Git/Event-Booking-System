import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Bookings from "./pages/Bookings";
import "./App.css";

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/events" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/events"} /> : <Login />}
      />
      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <Admin />
          </RequireAuth>
        }
      />
      <Route
        path="/events"
        element={
          <RequireAuth>
            <Events />
          </RequireAuth>
        }
      />
      <Route
        path="/events/:id"
        element={
          <RequireAuth>
            <EventDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/bookings"
        element={
          <RequireAuth>
            <Bookings />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
