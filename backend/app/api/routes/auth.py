from fastapi import APIRouter,Depends, HTTPException,status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.security import hash_password
from app.db.models import User
from app.schemas.auth import RegisterRequest, UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register",
             response_model=UserResponse,
             status_code=status.HTTP_201_CREATED
)

def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(
            (User.email == data.email) 
            | (User.username == data.username)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or username already exists"
        )
    user = User(
        email=data.email,
        username=data.username,
        password_hash = hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
