import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "smarthire_db")

# Initialize db as None initially
db = None

if not MONGO_URI:
    print("❌ ERROR: MONGODB_URI not found in environment variables!", file=sys.stderr)
else:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
        # Trigger a connection to verify
        client.admin.command('ping')
        db = client[DB_NAME]
        print(f"✅ Database connected successfully to: {DB_NAME}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}", file=sys.stderr)

# Collections
resume_collection = db["resumes"]
job_collection = db["jobs"]
user_collection = db["users"]
chat_collection = db["chats"]  # Chat history storage
quiz_collection = db["quizzes"]  # Skill verification quizzes
