from fastapi import APIRouter
from pydantic import BaseModel
import uuid, json, base64, sys

from ..utils.db import user_collection
from ..utils.security import verify_password, hash_password

router = APIRouter(tags=["auth"])

class AuthRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/signup")
def signup(data: AuthRequest):
    if user_collection.find_one({"email": data.email}):
        return {"error": "User already exists"}

    user = {
        "user_id": str(uuid.uuid4()),
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": "HR",
        "login_method": "password",
    }
    user_collection.insert_one(user)

    return {
        "message": "Signup successful",
        "user_id": user["user_id"],
        "email": user["email"],
    }

@router.post("/login")
def login(data: AuthRequest):
    user = user_collection.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        return {"error": "Invalid credentials"}

    return {
        "message": "Login successful",
        "user_id": user["user_id"],
        "email": user["email"],
    }

@router.post("/google")
def google_login(data: GoogleAuthRequest):
    try:
        token = data.token
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        user_data = json.loads(base64.urlsafe_b64decode(payload))

        email = user_data.get("email")
        name = user_data.get("name") or email.split("@")[0]
        google_id = user_data.get("sub")

        if not email or not google_id:
            return {"error": "Invalid Google token"}

        existing = user_collection.find_one({"email": email})
        if existing:
            return {
                "message": "Login successful",
                "user_id": existing["user_id"],
                "email": email,
                "name": existing.get("name", name),
            }

        user = {
            "user_id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "google_id": google_id,
            "role": "HR",
            "login_method": "google",
        }
        user_collection.insert_one(user)

        return {
            "message": "Signup successful",
            "user_id": user["user_id"],
            "email": email,
            "name": name,
        }

    except Exception as e:
        print("Google login error:", e, file=sys.stderr)
        return {"error": "Google login failed"}
