"""
Resume Data Migration Utility
This script helps fix existing resumes that may have empty or missing raw_text fields.
It builds comprehensive context from structured fields if the raw_text is missing.

Run this script once after updating the codebase to ensure all resumes have proper context data.
"""
import os
import sys

# Add Backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "Backend"))

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "smarthire_db")

def build_context_from_fields(doc: dict) -> str:
    """Build comprehensive text context from structured resume fields."""
    parts = []
    
    if doc.get("name"):
        parts.append(f"Candidate Name: {doc['name']}")
    
    if doc.get("email"):
        parts.append(f"Email: {doc['email']}")
    
    if doc.get("phone"):
        parts.append(f"Phone: {doc['phone']}")
    
    if doc.get("location"):
        parts.append(f"Location: {doc['location']}")
    
    exp_years = doc.get("experience_years", 0)
    if exp_years > 0:
        parts.append(f"Experience: {exp_years} years")
    elif doc.get("is_fresher"):
        parts.append("Experience: Fresher / Entry-level")
    
    skills = doc.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    
    education = doc.get("education", [])
    if education:
        if isinstance(education, list):
            parts.append(f"Education: {', '.join(str(e) for e in education)}")
        else:
            parts.append(f"Education: {education}")
    
    experience = doc.get("experience", [])
    if experience:
        if isinstance(experience, list):
            parts.append(f"Work Experience: {', '.join(str(e) for e in experience)}")
        else:
            parts.append(f"Work Experience: {experience}")
    
    if doc.get("summary"):
        parts.append(f"Summary: {doc['summary']}")
    
    if doc.get("certifications"):
        certs = doc.get("certifications")
        if isinstance(certs, list):
            parts.append(f"Certifications: {', '.join(str(c) for c in certs)}")
        else:
            parts.append(f"Certifications: {certs}")
    
    return "\n".join(parts)


def analyze_resumes():
    """Analyze the current state of resume data."""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    resumes = db["resumes"]
    
    total = resumes.count_documents({})
    print(f"📊 RESUME DATA ANALYSIS")
    print(f"=" * 50)
    print(f"Total resumes in database: {total}")
    
    # Check raw_text presence
    with_raw_text = resumes.count_documents({
        "raw_text": {"$exists": True, "$ne": "", "$ne": None}
    })
    print(f"Resumes WITH valid raw_text: {with_raw_text}")
    print(f"Resumes WITHOUT valid raw_text: {total - with_raw_text}")
    
    # Check other fields
    with_skills = resumes.count_documents({"skills": {"$exists": True, "$ne": []}})
    with_name = resumes.count_documents({"name": {"$exists": True, "$ne": "", "$ne": None}})
    with_email = resumes.count_documents({"email": {"$exists": True, "$ne": "", "$ne": None}})
    
    print(f"\nField presence:")
    print(f"  - With name: {with_name}")
    print(f"  - With email: {with_email}")
    print(f"  - With skills: {with_skills}")
    
    # Show sample
    sample = resumes.find_one({})
    if sample:
        print(f"\n📄 SAMPLE RESUME FIELDS:")
        for key in sample.keys():
            if key != "_id":
                value = sample[key]
                if key == "raw_text":
                    print(f"  - {key}: {len(value) if value else 0} chars")
                elif isinstance(value, list):
                    print(f"  - {key}: {len(value)} items")
                elif isinstance(value, str) and len(value) > 50:
                    print(f"  - {key}: {value[:50]}...")
                else:
                    print(f"  - {key}: {value}")
    
    client.close()
    return total, with_raw_text


def fix_resumes_without_raw_text():
    """
    For resumes without raw_text, build context from structured fields
    and save it back to the database.
    """
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    resumes = db["resumes"]
    
    # Find resumes without valid raw_text
    missing_raw_text = list(resumes.find({
        "$or": [
            {"raw_text": {"$exists": False}},
            {"raw_text": ""},
            {"raw_text": None}
        ]
    }))
    
    print(f"\n🔧 FIXING RESUMES WITHOUT RAW_TEXT")
    print(f"=" * 50)
    print(f"Found {len(missing_raw_text)} resumes to fix")
    
    fixed_count = 0
    for doc in missing_raw_text:
        context = build_context_from_fields(doc)
        
        if context and len(context.strip()) > 20:
            # Update the document with generated context
            resumes.update_one(
                {"_id": doc["_id"]},
                {"$set": {"raw_text": context}}
            )
            fixed_count += 1
            print(f"  ✅ Fixed: {doc.get('name', 'Unknown')} - {len(context)} chars")
        else:
            print(f"  ⚠️ Skipped (no data): {doc.get('name', 'Unknown')}")
    
    print(f"\n✨ Fixed {fixed_count} resumes")
    client.close()
    return fixed_count


def main():
    print(f"\n{'='*60}")
    print(f"RESUME DATABASE MIGRATION UTILITY")
    print(f"MongoDB: {DB_NAME}")
    print(f"{'='*60}\n")
    
    # First, analyze current state
    total, with_raw_text = analyze_resumes()
    
    if total == 0:
        print("\n⚠️ No resumes found in database.")
        return
    
    if total == with_raw_text:
        print("\n✅ All resumes already have valid raw_text. No fix needed!")
        return
    
    # Auto-run for agent
    print(f"\n⚡ AUTOMATICALLY FIXING {total - with_raw_text} resumes...")
    fix_resumes_without_raw_text()
    print("\n🎉 Migration complete! Your chatbot should now work correctly.")


if __name__ == "__main__":
    main()
