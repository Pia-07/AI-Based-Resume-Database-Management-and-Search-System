import sys
import os

# Add Backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), "Backend"))

try:
    from app.utils.db import resume_collection, chat_collection, db
    
    print(f"✅ Successfully imported db from app.utils.db")
    
    # Check resume count
    resume_count = resume_collection.count_documents({})
    print(f"📄 Total resumes in DB: {resume_count}")
    
    # Filter by a dummy user_id to see if it works
    user_id = "test123"
    filter_query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}, {"user_id": None}]}
    filtered_count = resume_collection.count_documents(filter_query)
    print(f"🔍 Filtered resumes for user '{user_id}': {filtered_count}")
    
    # Check chat count
    chat_count = chat_collection.count_documents({})
    print(f"💬 Total chats in DB: {chat_count}")
    
    user_chats = list(chat_collection.find({"user_id": user_id}))
    print(f"📂 Chats for user '{user_id}': {len(user_chats)}")

except Exception as e:
    print(f"❌ Error during verification: {e}")
    import traceback
    traceback.print_exc()
