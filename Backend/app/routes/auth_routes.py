from fastapi import APIRouter
from pydantic import BaseModel
import uuid
from ..utils.db import user_collection
from ..utils.security import verify_password


router = APIRouter()

# -------------------------
# Request Schemas
# -------------------------
class AuthRequest(BaseModel):
    email: str
    password: str


# -------------------------
# Signup
# -------------------------
@router.post("/signup")
def signup(data: AuthRequest):
    existing = user_collection.find_one({"email": data.email})
    if existing:
        return {"error": "User already exists"}

    user = {
        "user_id": str(uuid.uuid4()),
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": "HR"
    }

    user_collection.insert_one(user)

    return {"message": "Signup successful"}


# -------------------------
# Login
# -------------------------
@router.post("/login")
def login(data: AuthRequest):
    user = user_collection.find_one({"email": data.email})
    if not user:
        return {"error": "Invalid credentials"}

    if not verify_password(data.password, user["password_hash"]):
        return {"error": "Invalid credentials"}

    return {
        "message": "Login successful",
        "user_id": user["user_id"]
    }
