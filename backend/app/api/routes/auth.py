from fastapi import APIRouter,Depends, HTTPException,status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password


from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse


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

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user : User = Depends(get_current_user)
): 
    return current_user


@router.post("/login")
def login(
    data : LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User).filter(User.email == data.email).first()
    )

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
    user_id=user.id,
    email=user.email
)

    return {
        "message": "Login successful",
        "access_token" : access_token,
        "token_type" : "bearer"
        }
