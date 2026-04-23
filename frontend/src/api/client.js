import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:7000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Auth ───────────────────────────────────────────────────────────────────────
export const signup = (data) =>
  api.post("/auth/signup", data).then((r) => r.data);

export const login = (username, password) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);

// ── Events ─────────────────────────────────────────────────────────────────────
export const getEvents = (search = "") =>
  api.get("/events", { params: { search } }).then((r) => r.data);

export const getEvent = (id) =>
  api.get(`/events/${id}`).then((r) => r.data);

export const createEvent = (data) =>
  api.post("/events", data).then((r) => r.data);

// ── Recommendations (ML) ───────────────────────────────────────────────────────
export const getRecommendations = (userId = null, topN = 5) =>
  api
    .get("/events/recommendations", { params: { user_id: userId, top_n: topN } })
    .then((r) => r.data);

// ── Seats ──────────────────────────────────────────────────────────────────────
export const getSeats = (eventId) =>
  api.get(`/events/${eventId}/seats`).then((r) => r.data);

// ── Bookings ───────────────────────────────────────────────────────────────────
export const bookSeats = (eventId, seatIds, userId) =>
  api
    .post(`/events/${eventId}/book`, { seat_ids: seatIds, user_id: userId })
    .then((r) => r.data);

export const cancelBooking = (bookingId, userId) =>
  api
    .delete(`/bookings/${bookingId}`, { params: { user_id: userId } })
    .then((r) => r.data);

export const getUserBookings = (userId) =>
  api.get(`/bookings/user/${userId}`).then((r) => r.data);

export default api;
