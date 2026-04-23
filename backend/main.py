from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, SessionLocal
from models import models
from api import events, bookings, auth
from services.auth_service import ensure_admin

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="3D Event Booking System",
    description="Production-grade event booking with 3D seats, ML recommendations, and SMS notifications.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(bookings.router)


@app.on_event("startup")
def startup_event():
    """Seed the default admin account."""
    db = SessionLocal()
    try:
        ensure_admin(db)
    finally:
        db.close()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "EventSphere API v2.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
