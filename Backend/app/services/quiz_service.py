"""
Quiz Service — Generates skill-based MCQ quizzes using Google Gemini API.

Generates 10-15 multiple-choice questions based on a candidate's listed skills,
evaluates submitted answers, and stores results in MongoDB.
"""

import uuid
import json
import re
from datetime import datetime, timedelta

from google import genai

from ..utils.db import quiz_collection
import os

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ── Hardcoded Candidates (from resumes) ──
HARDCODED_CANDIDATES = [
    {
        "name": "Pia Patel",
        "email": "piapatel9983@gmail.com",
        "skills": ["Python", "React", "SQL", "Machine Learning", "Data Analysis"],
    },
    {
        "name": "Hetvi Radadiya",
        "email": "hetvihradadiya@gmail.com",
        "skills": ["Java", "Spring Boot", "MongoDB", "REST APIs", "HTML/CSS"],
    },
]


def ensure_candidates_quizzes():
    """
    Auto-generate quizzes for hardcoded candidates if they don't already exist.
    Called once during server startup. Idempotent — skips if quiz already exists.
    """
    for candidate in HARDCODED_CANDIDATES:
        existing = quiz_collection.find_one({
            "candidate_email": candidate["email"],
            "status": {"$in": ["pending", "email_sent"]},
        })
        if existing:
            print(f"✅ Quiz already exists for {candidate['name']} ({existing['quiz_id']})")
            continue

        print(f"🔄 Generating quiz for {candidate['name']}...")
        try:
            result = generate_quiz(
                candidate_name=candidate["name"],
                candidate_email=candidate["email"],
                skills=candidate["skills"],
                user_id="system-auto",
                time_limit_minutes=20,
            )
            print(f"✅ Quiz generated for {candidate['name']}: {result['quiz_id']} ({result['total_questions']} questions)")
        except Exception as e:
            print(f"❌ Failed to generate quiz for {candidate['name']}: {e}")



def generate_quiz(candidate_name: str, candidate_email: str, skills: list[str],
                   user_id: str, time_limit_minutes: int = 20) -> dict:
    """
    Generate a skill verification quiz using Gemini API.
    
    Args:
        candidate_name: Name of the candidate
        candidate_email: Email of the candidate
        skills: List of skills from the candidate's resume
        user_id: HR user who created this quiz
        time_limit_minutes: Time limit in minutes (default 20)
    
    Returns:
        dict with quiz_id, questions count, and quiz link
    """
    quiz_id = str(uuid.uuid4())
    skills_str = ", ".join(skills)

    # Prompt Gemini to generate quiz questions
    prompt = f"""Generate a skill verification quiz for a candidate with the following skills: {skills_str}

Requirements:
- Generate exactly 12 multiple-choice questions
- Each question should test practical knowledge of the listed skills
- Mix difficulty levels: 4 easy, 4 medium, 4 hard
- Each question must have exactly 4 options (A, B, C, D)
- Provide the correct answer index (0-3)

Return ONLY a valid JSON array with no markdown formatting, no code fences, no explanation. Each element must have:
- "id": question number (1-12)
- "question": the question text
- "options": array of 4 option strings
- "correct": index of correct answer (0-3)
- "difficulty": "easy", "medium", or "hard"
- "skill": which skill this question tests

Example format:
[{{"id":1,"question":"What is...?","options":["A","B","C","D"],"correct":0,"difficulty":"easy","skill":"Python"}}]
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        raw_text = response.text.strip()
        
        # Clean markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
        
        questions = json.loads(raw_text)
        
        # Validate question structure
        validated_questions = []
        for q in questions:
            if all(k in q for k in ("id", "question", "options", "correct")):
                validated_questions.append({
                    "id": q["id"],
                    "question": q["question"],
                    "options": q["options"][:4],  # Ensure max 4 options
                    "correct": int(q["correct"]),
                    "difficulty": q.get("difficulty", "medium"),
                    "skill": q.get("skill", skills[0] if skills else "General"),
                })
        
        if len(validated_questions) < 5:
            raise ValueError(f"Only {len(validated_questions)} valid questions generated")

    except Exception as e:
        print(f"⚠️ Gemini quiz generation failed: {e}, using fallback questions")
        validated_questions = _generate_fallback_questions(skills)

    # Build quiz document
    quiz_doc = {
        "quiz_id": quiz_id,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "skills": skills,
        "questions": validated_questions,
        "answers": None,
        "score": None,
        "total_questions": len(validated_questions),
        "time_limit_minutes": time_limit_minutes,
        "status": "pending",  # pending | completed | expired
        "created_at": datetime.utcnow().isoformat(),
        "submitted_at": None,
        "created_by": user_id,
    }

    # Store in MongoDB
    quiz_collection.insert_one(quiz_doc)

    return {
        "quiz_id": quiz_id,
        "total_questions": len(validated_questions),
        "time_limit_minutes": time_limit_minutes,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
    }


def get_quiz(quiz_id: str) -> dict | None:
    """
    Retrieve a quiz by ID. Returns questions WITHOUT correct answers
    (for candidate-facing view).
    """
    quiz = quiz_collection.find_one({"quiz_id": quiz_id}, {"_id": 0})
    if not quiz:
        return None

    # Strip correct answers from questions (candidates shouldn't see them)
    safe_questions = []
    for q in quiz.get("questions", []):
        safe_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "difficulty": q.get("difficulty", "medium"),
            "skill": q.get("skill", ""),
        })

    return {
        "quiz_id": quiz["quiz_id"],
        "candidate_name": quiz["candidate_name"],
        "skills": quiz["skills"],
        "questions": safe_questions,
        "total_questions": quiz["total_questions"],
        "time_limit_minutes": quiz["time_limit_minutes"],
        "status": quiz["status"],
        "created_at": quiz["created_at"],
    }


def submit_quiz(quiz_id: str, answers: dict) -> dict:
    """
    Score and save a candidate's quiz submission.
    
    Args:
        quiz_id: The quiz identifier
        answers: Dict of {question_id: selected_option_index}
    
    Returns:
        dict with score, total, percentage, and pass/fail status
    """
    quiz = quiz_collection.find_one({"quiz_id": quiz_id}, {"_id": 0})
    if not quiz:
        return {"error": "Quiz not found"}

    if quiz["status"] == "completed":
        return {"error": "Quiz already submitted"}

    # Calculate score
    correct_count = 0
    total = len(quiz["questions"])
    
    for q in quiz["questions"]:
        q_id = str(q["id"])
        if q_id in answers and int(answers[q_id]) == q["correct"]:
            correct_count += 1

    percentage = round((correct_count / total) * 100, 1) if total > 0 else 0
    passed = percentage >= 60  # 60% pass threshold

    # Update quiz in database
    quiz_collection.update_one(
        {"quiz_id": quiz_id},
        {"$set": {
            "answers": answers,
            "score": correct_count,
            "percentage": percentage,
            "passed": passed,
            "status": "completed",
            "submitted_at": datetime.utcnow().isoformat(),
        }}
    )

    return {
        "quiz_id": quiz_id,
        "score": correct_count,
        "total": total,
        "percentage": percentage,
        "passed": passed,
        "status": "completed",
    }


def get_all_results(user_id: str = None) -> list:
    """
    Get all quiz results, optionally filtered by the HR user who created them.
    """
    query = {}
    if user_id:
        query["created_by"] = user_id

    results = list(quiz_collection.find(
        query,
        {"_id": 0, "questions": 0, "answers": 0}  # Exclude bulky fields
    ).sort("created_at", -1))

    return results


def _generate_fallback_questions(skills: list[str]) -> list[dict]:
    """
    Generate basic fallback questions if Gemini API fails.
    Creates 2 generic questions per skill (up to 12 total).
    """
    questions = []
    q_id = 1

    templates = [
        {
            "question": "Which of the following best describes {skill}?",
            "options": [
                "A programming language",
                "A framework or library",
                "A methodology or concept",
                "A database technology"
            ],
            "correct": 2,
        },
        {
            "question": "What is a common use case for {skill}?",
            "options": [
                "Web development",
                "Data analysis",
                "System administration",
                "All of the above"
            ],
            "correct": 3,
        },
    ]

    for skill in skills[:6]:  # Max 6 skills × 2 = 12 questions
        for template in templates:
            questions.append({
                "id": q_id,
                "question": template["question"].format(skill=skill),
                "options": template["options"],
                "correct": template["correct"],
                "difficulty": "easy",
                "skill": skill,
            })
            q_id += 1

    return questions[:12]
