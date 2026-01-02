from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-12345")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Bcrypt has a 72 byte limit, truncate if necessary
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        import sys
        print(f"[AUTH] Validating token: {token[:30] if token else 'None'}...", file=sys.stderr, flush=True)
        print(f"[AUTH] SECRET_KEY: {SECRET_KEY[:20]}...", file=sys.stderr, flush=True)
        print(f"[AUTH] ALGORITHM: {ALGORITHM}", file=sys.stderr, flush=True)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        print(f"[AUTH] Token decoded, user_id (string): {user_id_str}", file=sys.stderr, flush=True)
        if user_id_str is None:
            print("[AUTH] User ID is None in token", file=sys.stderr, flush=True)
            raise credentials_exception
        try:
            user_id: int = int(user_id_str)
        except (ValueError, TypeError):
            print(f"[AUTH] Invalid user_id format: {user_id_str}", file=sys.stderr, flush=True)
            raise credentials_exception
    except JWTError as e:
        print(f"[AUTH] JWT Error: {e}", file=sys.stderr, flush=True)
        print(f"[AUTH] Token length: {len(token) if token else 0}", file=sys.stderr, flush=True)
        raise credentials_exception
    except Exception as e:
        print(f"[AUTH] Unexpected error: {e}", file=sys.stderr, flush=True)
        import traceback
        print(f"[AUTH] Traceback: {traceback.format_exc()}", file=sys.stderr, flush=True)
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"[AUTH] User not found with id: {user_id}")  # Debug log
        raise credentials_exception
    print(f"[AUTH] User authenticated: {user.email}")  # Debug log
    return user

