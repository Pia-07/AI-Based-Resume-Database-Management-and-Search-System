from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)

db = client["smarthire_db"]

resume_collection = db["resumes"]
job_collection = db["jobs"]
