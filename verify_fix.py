from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "smarthire_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
resumes = db["resumes"]

total = resumes.count_documents({})
with_text = resumes.count_documents({"raw_text": {"$exists": True, "$ne": ""}})
missing = total - with_text

print(f"Total: {total}")
print(f"With Text: {with_text}")
print(f"Missing: {missing}")

if missing == 0:
    print("✅ SUCCESS: All resumes have text context.")
else:
    print(f"❌ FAILURE: {missing} resumes still missing text.")
