from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from models.models import User
from schemas.schemas import UserSignup

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


def _hash(password: str) -> str:
    return pwd_ctx.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def ensure_admin(db: Session):
    """Create the default admin account if it doesn't exist yet."""
    existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if not existing:
        admin = User(
            username=ADMIN_USERNAME,
            email="admin@eventsphere.local",
            mobile_number="0000000000",
            hashed_password=_hash(ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        db.commit()


def signup(db: Session, data: UserSignup) -> User:
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        username=data.username,
        email=data.email,
        mobile_number=data.mobile_number,
        hashed_password=_hash(data.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user or not _verify(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return user
