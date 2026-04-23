from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from schemas.schemas import UserSignup, LoginRequest, LoginResponse, UserResponse
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    """Register a new user account."""
    return auth_service.signup(db, data)


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return user info + role."""
    user = auth_service.login(db, data.username, data.password)
    return LoginResponse(
        role=user.role,
        username=user.username,
        user_id=user.id,
        mobile_number=user.mobile_number,
        message=f"Welcome back, {user.username}!",
    )
