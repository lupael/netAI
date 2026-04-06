"""JWT authentication routes."""
from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/login",
    summary="Authenticate and obtain a JWT access token",
    responses={401: {"description": "Invalid credentials"}},
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Authenticate with username/password and return a signed JWT bearer token."""
    username = authenticate_user(form_data.username, form_data.password)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        subject=username,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    summary="Return the currently authenticated user",
    responses={401: {"description": "Not authenticated"}},
)
async def get_me(current_user: str = Depends(get_current_user)):
    """Return the username of the bearer-token owner."""
    return {"username": current_user}
