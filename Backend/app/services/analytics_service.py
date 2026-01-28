from collections import Counter
from ..utils.db import resume_collection
from datetime import datetime

# 🔵 PIE / BAR — SKILL DISTRIBUTION
def skill_distribution():
    resumes = resume_collection.find({}, {"skills": 1})
    skills = []

    for r in resumes:
        skills.extend(r.get("skills", []))

    counter = Counter(skills)
    return {
        "type": "pie",
        "title": "Skill Distribution",
        "labels": list(counter.keys()),
        "values": list(counter.values())
    }


# 🟢 BAR — EXPERIENCE DISTRIBUTION
def experience_distribution():
    resumes = resume_collection.find({}, {"experience": 1})
    buckets = {"0-2": 0, "3-5": 0, "6-10": 0, "10+": 0}

    for r in resumes:
        exp = r.get("experience", 0)
        if exp <= 2:
            buckets["0-2"] += 1
        elif exp <= 5:
            buckets["3-5"] += 1
        elif exp <= 10:
            buckets["6-10"] += 1
        else:
            buckets["10+"] += 1

    return {
        "type": "bar",
        "title": "Experience Distribution",
        "labels": list(buckets.keys()),
        "values": list(buckets.values())
    }


# 🟣 LINE — UPLOAD TREND
def upload_trend():
    resumes = resume_collection.find({})
    counter = Counter()

    for r in resumes:
        ts = r["_id"].generation_time  # Mongo auto timestamp
        month = ts.strftime("%Y-%m")
        counter[month] += 1

    months = sorted(counter.keys())

    return {
        "type": "line",
        "title": "Resume Upload Trend",
        "labels": months,
        "values": [counter[m] for m in months],
    }
