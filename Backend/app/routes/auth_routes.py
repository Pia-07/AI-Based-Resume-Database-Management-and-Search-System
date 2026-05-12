import asyncio
from functools import partial

from fastapi import APIRouter
from pydantic import BaseModel
import uuid, json, base64, sys
import httpx

from ..utils.db import user_collection
from ..utils.security import verify_password, hash_password

router = APIRouter(tags=["auth"])


# Helper: run sync function in thread pool
async def _run_sync(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    if kwargs:
        return await loop.run_in_executor(None, partial(func, *args, **kwargs))
    return await loop.run_in_executor(None, func, *args)


class AuthRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/signup")
async def signup(data: AuthRequest):
    try:
        existing = await _run_sync(user_collection.find_one, {"email": data.email})
        if existing:
            return {"error": "User already exists"}

        user = {
            "user_id": str(uuid.uuid4()),
            "email": data.email,
            "password_hash": hash_password(data.password),
            "role": "HR",
            "login_method": "password",
        }
        await _run_sync(user_collection.insert_one, user)

        return {
            "message": "Signup successful",
            "user_id": user["user_id"],
            "email": user["email"],
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Signup failed: {str(e)}"}

@router.post("/login")
async def login(data: AuthRequest):
    user = await _run_sync(user_collection.find_one, {"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        return {"error": "Invalid credentials"}

    return {
        "message": "Login successful",
        "user_id": user["user_id"],
        "email": user["email"],
    }

@router.post("/google")
async def google_login(data: GoogleAuthRequest):
    """
    Handle Google OAuth login using access token.
    Fetches user info from Google's userinfo API endpoint.
    Uses httpx.AsyncClient for non-blocking HTTP.
    """
    try:
        access_token = data.token
        
        # Validate token is not empty
        if not access_token or not access_token.strip():
            print("❌ Google login failed: Empty access token", file=sys.stderr)
            return {"error": "Invalid access token provided"}
        
        print(f"🔐 Google OAuth: Received access token (length: {len(access_token)})", file=sys.stderr)
        
        # Call Google's userinfo API — async, non-blocking
        userinfo_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print(f"📡 Fetching user info from Google API...", file=sys.stderr)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(userinfo_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Google API returned status {response.status_code}: {response.text}", file=sys.stderr)
                return {"error": f"Failed to fetch user info from Google (status: {response.status_code})"}
            
            user_data = response.json()
            print(f"✅ Successfully fetched user data from Google", file=sys.stderr)
            
        except httpx.TimeoutException:
            print("❌ Google API request timed out", file=sys.stderr)
            return {"error": "Google authentication timed out. Please try again."}
        except httpx.RequestError as e:
            print(f"❌ Failed to connect to Google API: {e}", file=sys.stderr)
            return {"error": "Failed to connect to Google. Please check your internet connection."}
        
        # Extract user information
        email = user_data.get("email")
        name = user_data.get("name")
        google_id = user_data.get("id")  # Note: Google API uses "id" not "sub"
        
        # Validate required fields
        if not email:
            print(f"❌ No email in Google response: {user_data}", file=sys.stderr)
            return {"error": "Could not retrieve email from Google account"}
        
        if not google_id:
            print(f"❌ No user ID in Google response: {user_data}", file=sys.stderr)
            return {"error": "Could not retrieve user ID from Google account"}
        
        # Use email username as fallback for name
        if not name:
            name = email.split("@")[0]
        
        print(f"👤 Processing Google login for: {email}", file=sys.stderr)
        
        # Check if user already exists — MongoDB I/O, offload
        try:
            existing = await _run_sync(user_collection.find_one, {"email": email})
            
            if existing:
                print(f"✅ User found in database: {email}", file=sys.stderr)
                return {
                    "message": "Login successful",
                    "user_id": existing["user_id"],
                    "email": email,
                    "name": existing.get("name", name),
                }
            
            # Create new user
            print(f"📝 Creating new user for: {email}", file=sys.stderr)
            user = {
                "user_id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "google_id": google_id,
                "role": "HR",
                "login_method": "google",
            }
            await _run_sync(user_collection.insert_one, user)
            
            print(f"✅ New user created successfully: {email}", file=sys.stderr)
            
            return {
                "message": "Signup successful",
                "user_id": user["user_id"],
                "email": email,
                "name": name,
            }
            
        except Exception as db_error:
            print(f"❌ Database error during Google login: {db_error}", file=sys.stderr)
            return {"error": "Database error. Please try again later."}

    except Exception as e:
        print(f"❌ Unexpected error in Google login: {type(e).__name__}: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": f"Authentication failed: {str(e)}"}
