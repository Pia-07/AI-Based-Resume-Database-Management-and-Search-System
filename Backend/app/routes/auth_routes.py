from fastapi import APIRouter
import uuid
from ..utils.db import user_collection
from ..utils.security import hash_password, verify_password

router = APIRouter()

@router.post("/signup")
def signup(email: str, password: str):
    existing = user_collection.find_one({"email": email})
    if existing:
        return {"error": "User already exists"}

    user = {
        "user_id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(password),
        "role": "HR"
    }

    user_collection.insert_one(user)

    return {"message": "Signup successful"}

from ..utils.security import verify_password

@router.post("/login")
def login(email: str, password: str):
    user = user_collection.find_one({"email": email})
    if not user:
        return {"error": "Invalid credentials"}

    if not verify_password(password, user["password_hash"]):
        return {"error": "Invalid credentials"}

    return {
        "message": "Login successful",
        "user_id": user["user_id"]
    }

