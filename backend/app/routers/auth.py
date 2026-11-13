from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, UserOut
from app.services import auth_service

import logging

router = APIRouter(prefix="/auth", tags=["Auth"])

logger = logging.getLogger("app.auth")

@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, form.username, form.password)
    if not user:
        # Log the client address only. Never log the submitted username:
        # people sometimes paste their password into that field.
        logger.warning("login_failed ip=%s", request.client.host if request.client else "-")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info("login_ok user_id=%s", user.id)
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# TEMPORARY: proves RBAC works. Delete once real Admin-only endpoints exist.
@router.get("/admin-check")
def admin_check(user: User = Depends(require_roles("Admin"))):
    return {"message": f"Hello Admin {user.email}"}