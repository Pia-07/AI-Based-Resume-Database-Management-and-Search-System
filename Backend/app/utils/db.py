<<<<<<< HEAD
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://23cs081:hetvi123@smarthire-cluster.nuhvf9y.mongodb.net/?appName=smarthire-cluster"

client = MongoClient(MONGO_URI)

db = client["smarthire_db"]

resume_collection = db["resumes"]
job_collection = db["jobs"]
=======
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://23cs081:hetvi123@smarthire-cluster.nuhvf9y.mongodb.net/?appName=smarthire-cluster"

client = MongoClient(MONGO_URI)

db = client["smarthire_db"]

resume_collection = db["resumes"]
job_collection = db["jobs"]
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
