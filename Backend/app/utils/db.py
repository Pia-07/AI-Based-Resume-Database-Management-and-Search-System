from pymongo import MongoClient

MONGO_URI = "mongodb+srv://23cs081:<db_password>@smarthire-cluster.nuhvf9y.mongodb.net/?appName=smarthire-cluster"

client = MongoClient(MONGO_URI)

db = client["smarthire_db"]

resume_collection = db["resumes"]
job_collection = db["jobs"]
