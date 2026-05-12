"""
Students Routes
API endpoints for the All Students Dashboard with filtering, sorting, and search.
"""
from fastapi import APIRouter, Query
from typing import Optional, List
import re

from ..utils.db import resume_collection

router = APIRouter(tags=["students"])


@router.get("/students")
def get_students(
    location: Optional[str] = Query(None, description="Filter by location"),
    experience_min: Optional[float] = Query(None, description="Minimum experience years"),
    experience_max: Optional[float] = Query(None, description="Maximum experience years"),
    certification: Optional[str] = Query(None, description="Comma-separated certifications"),
    sort: Optional[str] = Query(None, description="Sort: name_asc, name_desc, exp_asc, exp_desc"),
    search: Optional[str] = Query(None, description="Search by name, skill, or keyword"),
):
    """
    Get all students/resumes with optional filtering, sorting, and search.
    Also returns available filter options (unique locations, certifications).
    """
    # Build MongoDB filter
    filter_query = {}

    # Location filter
    if location:
        filter_query["location"] = {"$regex": f"^{re.escape(location)}$", "$options": "i"}

    # Experience range filter
    if experience_min is not None or experience_max is not None:
        exp_filter = {}
        if experience_min is not None:
            exp_filter["$gte"] = experience_min
        if experience_max is not None:
            exp_filter["$lte"] = experience_max
        filter_query["experience_years"] = exp_filter

    # Certification filter (comma-separated, match any)
    if certification:
        cert_list = [c.strip() for c in certification.split(",") if c.strip()]
        if cert_list:
            filter_query["certifications"] = {
                "$elemMatch": {
                    "$regex": "|".join([re.escape(c) for c in cert_list]),
                    "$options": "i"
                }
            }

    # Search filter (across name, skills, certifications, location)
    if search:
        search_regex = {"$regex": re.escape(search), "$options": "i"}
        filter_query["$or"] = [
            {"name": search_regex},
            {"skills": {"$elemMatch": search_regex}},
            {"certifications": {"$elemMatch": search_regex}},
            {"location": search_regex},
            {"summary": search_regex},
        ]

    # Determine sort order
    sort_field = None
    sort_direction = 1  # 1 = ascending, -1 = descending
    if sort:
        if sort == "name_asc":
            sort_field = "name"
            sort_direction = 1
        elif sort == "name_desc":
            sort_field = "name"
            sort_direction = -1
        elif sort == "exp_asc":
            sort_field = "experience_years"
            sort_direction = 1
        elif sort == "exp_desc":
            sort_field = "experience_years"
            sort_direction = -1

    # Query MongoDB
    projection = {
        "_id": 0, "raw_text": 0, "embedding": 0,
        "file_key": 0, "resume_s3_key": 0, "file_url": 0, "resume_url": 0
    }

    cursor = resume_collection.find(filter_query, projection)

    if sort_field:
        cursor = cursor.sort(sort_field, sort_direction)

    students = list(cursor)

    # Get unique filter options from ALL resumes (not just filtered ones)
    all_locations = resume_collection.distinct("location")
    all_locations = sorted([loc for loc in all_locations if loc and loc.strip()])

    all_certifications = resume_collection.distinct("certifications")
    all_certifications = sorted([c for c in all_certifications if c and c.strip()])

    return {
        "students": students,
        "count": len(students),
        "filters": {
            "locations": all_locations,
            "certifications": all_certifications,
        }
    }
