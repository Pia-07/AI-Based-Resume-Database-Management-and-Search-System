import sys
sys.path.insert(0, '.')
from app.utils.db import resume_collection

# Sample docs
print("=== SAMPLE DOCS ===")
docs = list(resume_collection.find({}, {"_id": 0, "name": 1, "skills": 1, "location": 1, "experience_years": 1}).limit(5))
for d in docs:
    print("name:", d.get("name"))
    print("location:", d.get("location"))
    print("skills:", d.get("skills", [])[:5])
    print("experience_years:", d.get("experience_years"))
    print("---")

# Android in raw_text
print("\n=== ANDROID in raw_text ===")
android_raw = list(resume_collection.find(
    {"raw_text": {"$regex": "android", "$options": "i"}},
    {"_id": 0, "name": 1, "skills": 1}
).limit(5))
print(f"Count: {len(android_raw)}")
for d in android_raw[:3]:
    print("  name:", d.get("name"), "| skills:", d.get("skills", [])[:5])

# Android in skills
print("\n=== ANDROID in skills array ===")
android_skill = list(resume_collection.find(
    {"skills": {"$elemMatch": {"$regex": "android", "$options": "i"}}},
    {"_id": 0, "name": 1, "skills": 1}
).limit(5))
print(f"Count: {len(android_skill)}")
for d in android_skill[:3]:
    print("  name:", d.get("name"), "| skills:", d.get("skills", [])[:5])

# Python near Ahmedabad
print("\n=== PYTHON near AHMEDABAD ===")
python_ahm = list(resume_collection.find(
    {
        "$or": [
            {"skills": {"$elemMatch": {"$regex": "python", "$options": "i"}}},
            {"raw_text": {"$regex": "python", "$options": "i"}}
        ],
        "location": {"$regex": "ahmedabad", "$options": "i"}
    },
    {"_id": 0, "name": 1, "location": 1, "experience_years": 1}
).limit(10))
print(f"Count: {len(python_ahm)}")
for d in python_ahm:
    print("  name:", d.get("name"), "| location:", d.get("location"), "| exp:", d.get("experience_years"))

# Check if name field is sometimes None or missing
print("\n=== NAME FIELD ANALYSIS ===")
total = resume_collection.count_documents({})
no_name = resume_collection.count_documents({"name": {"$in": [None, "", "Not available"]}})
print(f"Total: {total}, Missing/null name: {no_name}")
