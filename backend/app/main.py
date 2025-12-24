from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud
from .auth import create_access_token, get_current_user, get_db, verify_password
from .config import settings
from .models import User
from .schemas import PasswordReset, Token, UserCreate, UserOut, UserUpdate

app = FastAPI(title='Audir API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.post('/auth/login', response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username.lower()).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid login')

    token = create_access_token(str(user.id), user.tenant_id, user.role)
    crud.set_last_active(db, user)
    return Token(access_token=token)


@app.get('/users', response_model=list[UserOut])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.list_users(db, current_user.tenant_id)


@app.post('/users', response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_user(db, current_user.tenant_id, payload)


@app.put('/users/{user_id}', response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.tenant_id == current_user.tenant_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return crud.update_user(db, user, payload)


@app.post('/users/{user_id}/reset-password', response_model=UserOut)
def reset_password(
    user_id: int,
    payload: PasswordReset,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.tenant_id == current_user.tenant_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return crud.reset_password(db, user, payload.new_password)
