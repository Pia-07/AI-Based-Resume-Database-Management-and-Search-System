"""
Analytics Service
Provides data analytics for resume insights including skill distribution,
experience levels, location distribution, and upload trends.
Fetches ALL resumes from MongoDB (no user-based filtering for analytics).
"""
from collections import Counter
from typing import Optional
from ..utils.db import resume_collection
from datetime import datetime


def _get_all_resumes_filter(user_id: Optional[str] = None):
    """
    Returns a filter query that includes ALL resumes.
    For analytics, we want to show data from ALL uploaded resumes,
    not just those belonging to the current user.
    
    If user_id is provided and you want user-specific analytics,
    set include_all=False. Otherwise, returns {} to get ALL resumes.
    """
    # For analytics, always return ALL resumes regardless of user_id
    # This ensures HR can see complete analytics of all candidates
    return {}


# 🔵 PIE / BAR — SKILL DISTRIBUTION
def skill_distribution(user_id: Optional[str] = None, chart_type: str = "pie"):
    """
    Get skill distribution across ALL resumes in the database.
    Returns pie chart data by default, can be changed to bar.
    """
    # Get ALL resumes, not filtered by user
    resumes = resume_collection.find({}, {"skills": 1})
    skills = []

    for r in resumes:
        skills.extend(r.get("skills", []))

    if not skills:
        # Return sample data if no skills found
        return {
            "type": chart_type,
            "title": "Skill Distribution",
            "labels": ["No data available"],
            "values": [1]
        }

    counter = Counter(skills)
    
    # Sort by frequency and get top 15 skills for better visualization
    top_skills = counter.most_common(15)
    
    return {
        "type": chart_type,
        "title": "Skill Distribution",
        "labels": [skill for skill, count in top_skills],
        "values": [count for skill, count in top_skills]
    }


# 🟢 BAR — EXPERIENCE DISTRIBUTION
def experience_distribution(user_id: Optional[str] = None, chart_type: str = "bar"):
    """
    Get experience level distribution across ALL resumes.
    """
    resumes = resume_collection.find({}, {"experience_years": 1})
    buckets = {"0-2 years": 0, "3-5 years": 0, "6-10 years": 0, "10+ years": 0}

    count = 0
    for r in resumes:
        count += 1
        exp = r.get("experience_years", 0) or 0
        if exp <= 2:
            buckets["0-2 years"] += 1
        elif exp <= 5:
            buckets["3-5 years"] += 1
        elif exp <= 10:
            buckets["6-10 years"] += 1
        else:
            buckets["10+ years"] += 1

    print(f"📊 Experience distribution: processed {count} resumes")

    return {
        "type": chart_type,
        "title": "Experience Distribution",
        "labels": list(buckets.keys()),
        "values": list(buckets.values())
    }


# 🔴 BAR/PIE — LOCATION DISTRIBUTION
def location_distribution(user_id: Optional[str] = None, chart_type: str = "bar"):
    """
    Get geographic distribution of ALL candidates.
    Strictly cleans up invalid values and extracts location from raw_text if needed.
    """
    resumes = list(resume_collection.find({}, {"location": 1}))
    
    locations = []
    invalid_count = 0
    
    # invalid_values to lowercase for case-insensitive comparison
    invalid_values = {
        "unknown", "null", "none", "", "n/a", "not specified", "not provided", 
        "anywhere", "remote", "open to relocate", "flexible"
    }

    for r in resumes:
        loc = r.get("location", "")
        
        # Clean up location value
        if loc and isinstance(loc, str):
            cleaned_loc = loc.strip()
            if len(cleaned_loc) > 2 and cleaned_loc.lower() not in invalid_values:
                # Normalize location (capitalize first letter of each word)
                # Also handle common messy formats if needed, but Title Case is a good start
                locations.append(cleaned_loc.title())
            else:
                invalid_count += 1
        else:
            invalid_count += 1
            
            # DO NOT try to extract from raw_text.
            # This causes massive false positives (e.g., extracting "Jaipur" from college names).
            # If the database field is empty/unknown, we simply exclude it from the chart
            # to make the chart accurate and meaningful.

    print(f"📍 Location Filtering: {len(locations)} valid, {invalid_count} invalid/missing locations.")

    if not locations:
        return {
            "type": chart_type,
            "title": "Location Distribution",
            "labels": ["No location data"],
            "values": [0]
        }
    
    counter = Counter(locations)
    
    # Get top 10 locations for better visualization
    top_locations = counter.most_common(10)
    
    print(f"📍 Location distribution: {len(top_locations)} top locations from {len(locations)} valid entries")
    
    return {
        "type": chart_type,
        "title": "Location Distribution",
        "labels": [loc for loc, count in top_locations],
        "values": [count for loc, count in top_locations]
    }


def _extract_location_from_text(text: str) -> Optional[str]:
    """Try to extract location from resume text."""
    if not text:
        return None
    
    # Common Indian cities and locations
    cities = [
        "Mumbai", "Delhi", "Bangalore", "Bengaluru", "Chennai", "Hyderabad",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow",
        "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
        "Patna", "Vadodara", "Gujarat", "Maharashtra", "Karnataka",
        "Tamil Nadu", "Telangana", "West Bengal", "Rajasthan", "Uttar Pradesh",
        "New York", "San Francisco", "London", "Singapore", "Dubai"
    ]
    
    text_lower = text.lower()
    for city in cities:
        if city.lower() in text_lower:
            return city
    
    return None


# 🟣 LINE — UPLOAD TREND
def upload_trend(user_id: Optional[str] = None, chart_type: str = "line"):
    """
    Get resume upload trends over time (ALL resumes).
    Groups by month to show upload patterns.
    """
    resumes = list(resume_collection.find({}, {"_id": 1, "uploaded_at": 1}))
    counter = Counter()

    for r in resumes:
        try:
            # Try to get timestamp from uploaded_at field first
            uploaded_at = r.get("uploaded_at")
            if uploaded_at:
                if isinstance(uploaded_at, str):
                    # Parse ISO format date
                    ts = datetime.fromisoformat(uploaded_at.replace('Z', '+00:00'))
                elif isinstance(uploaded_at, datetime):
                    ts = uploaded_at
                else:
                    ts = r["_id"].generation_time
            else:
                # Fallback to MongoDB ObjectId timestamp
                ts = r["_id"].generation_time
            
            month = ts.strftime("%Y-%m")
            counter[month] += 1
        except Exception as e:
            print(f"⚠️ Error processing resume timestamp: {e}")
            continue

    if not counter:
        # Return sample data if no data
        return {
            "type": chart_type,
            "title": "Resume Upload Trend",
            "labels": ["No data"],
            "values": [0]
        }

    months = sorted(counter.keys())
    
    print(f"📈 Upload trend: {len(months)} months, total {sum(counter.values())} resumes")

    return {
        "type": chart_type,
        "title": "Resume Upload Trend",
        "labels": months,
        "values": [counter[m] for m in months],
    }


import time

# Simple in-memory analytics cache (60-second TTL)
_analytics_cache: dict = {}  # key: (data_type, chart_type) -> {"data": ..., "ts": ...}
_CACHE_TTL = 60  # seconds


# 🌐 DYNAMIC CHART GENERATOR (with caching)
def generate_chart(chart_type: str, data_type: str, user_id: Optional[str] = None):
    """
    Generate any chart type for any data type.
    Results are cached for 60 seconds to avoid redundant MongoDB queries.
    
    Args:
        chart_type: 'pie', 'bar', or 'line'
        data_type: 'skill', 'experience', 'location', or 'trend'
        user_id: Optional user ID (not used for analytics)
    
    Returns:
        Chart data dictionary
    """
    cache_key = (data_type, chart_type)
    now = time.time()

    # Return cached result if fresh
    cached = _analytics_cache.get(cache_key)
    if cached and (now - cached["ts"]) < _CACHE_TTL:
        print(f"⚡ Analytics cache HIT for {cache_key}")
        return cached["data"]

    # Generate fresh data
    if data_type == "skill":
        result = skill_distribution(user_id, chart_type)
    elif data_type == "experience":
        result = experience_distribution(user_id, chart_type)
    elif data_type == "location":
        result = location_distribution(user_id, chart_type)
    elif data_type == "trend":
        result = upload_trend(user_id, chart_type)
    else:
        result = skill_distribution(user_id, chart_type)

    # Store in cache
    _analytics_cache[cache_key] = {"data": result, "ts": now}
    print(f"📊 Analytics cache MISS for {cache_key} — cached for {_CACHE_TTL}s")

    return result
