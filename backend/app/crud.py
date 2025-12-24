from datetime import datetime

from sqlalchemy.orm import Session

from .auth import hash_password
from .models import User
from .schemas import UserCreate, UserUpdate


def list_users(db: Session, tenant_id: int) -> list[User]:
    return (
        db.query(User)
        .filter(User.tenant_id == tenant_id)
        .order_by(User.created_at.desc())
        .all()
    )


def create_user(db: Session, tenant_id: int, payload: UserCreate) -> User:
    user = User(
        tenant_id=tenant_id,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        department=payload.department,
        role=payload.role,
        status=payload.status,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def set_last_active(db: Session, user: User) -> User:
    user.last_active = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user: User, new_password: str) -> User:
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user
