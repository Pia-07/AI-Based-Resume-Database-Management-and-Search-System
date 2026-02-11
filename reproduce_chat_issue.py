import sys
import os

# Add Backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), "Backend"))

try:
    from app.utils.db import resume_collection
    
    # Test user ID
    user_id = "test123"
    
    print(f"🔍 Testing Chatbot Count Logic for user: {user_id}")
    
    # Simulate the logic currently in chat_routes.py
    # Logic 1: Strict filter (Current Bug)
    strict_filter = {"user_id": user_id} if user_id else {}
    strict_count = resume_collection.count_documents(strict_filter)
    
    # Logic 2: Proposed Fix
    loose_filter = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}, {"user_id": None}]}
    loose_count = resume_collection.count_documents(loose_filter)
    
    print(f"🤖 Chatbot Logic Simulation:")
    print(f"   Current (Strict) Count: {strict_count}")
    print(f"   Fixed (Orphaned included) Count: {loose_count}")
    
    if strict_count == 0 and loose_count > 0:
        print("\n❌ VERIFIED: Chatbot sees 0 resumes because of strict filtering.")
    else:
        print("\n✅ INFO: No discrepancy found (or DB is empty).")

except Exception as e:
    print(f"❌ Error during reproduction: {e}")
    import traceback
    traceback.print_exc()
