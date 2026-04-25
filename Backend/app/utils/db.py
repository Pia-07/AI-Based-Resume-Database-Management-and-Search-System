import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "smarthire_db")

if not MONGO_URI:
    print("❌ ERROR: MONGODB_URI not found in environment variables!", file=sys.stderr)
    # Fallback for development if needed, but better to fail early in prod
    # MONGO_URI = "mongodb+srv://..." 

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Trigger a connection to verify
    client.admin.command('ping')
    db = client[DB_NAME]
    print(f"✅ Database connected successfully to: {DB_NAME}")
except Exception as e:
    print(f"❌ Database connection failed: {e}", file=sys.stderr)
    # In some setups, you might want to exit if DB is essential
    # sys.exit(1)

# Collections
resume_collection = db["resumes"]
job_collection = db["jobs"]
user_collection = db["users"]
chat_collection = db["chats"]  # Chat history storage
quiz_collection = db["quizzes"]  # Skill verification quizzes
