from pymongo import MongoClient
import os

# Use the same URI as in db.py to verify it
MONGO_URI = "mongodb+srv://23cs081:hetvi123@smarthire-cluster.nuhvf9y.mongodb.net/?appName=smarthire-cluster"

try:
    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client["smarthire_db"]
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully!")
    
    collections = db.list_collection_names()
    print(f"Collections in 'smarthire_db': {collections}")
    
    if "resumes" in collections:
        count = db["resumes"].count_documents({})
        print(f"📄 Resume count: {count}")
        
        # Check a few records to see structure
        if count > 0:
            sample = db["resumes"].find_one({}, {"_id": 0, "user_id": 1, "name": 1})
            print(f"Sample resume: {sample}")
    else:
        print("❌ 'resumes' collection NOT found!")

    if "chats" in collections:
        chat_count = db["chats"].count_documents({})
        print(f"💬 Chat count: {chat_count}")
        if chat_count > 0:
            sample_chat = db["chats"].find_one({}, {"_id": 0, "user_id": 1, "title": 1})
            print(f"Sample chat: {sample_chat}")
    else:
        print("❌ 'chats' collection NOT found!")

except Exception as e:
    print(f"❌ Connection failed: {e}")
finally:
    client.close()
