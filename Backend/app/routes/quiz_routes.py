"""
Quiz Routes — API endpoints for skill verification quizzes.

Endpoints:
- POST /quiz/generate  — HR generates a quiz for a candidate
- POST /quiz/send-email — Send quiz link via email (static)
- GET  /quiz/results    — HR gets all quiz results
- GET  /quiz/{quiz_id}  — Public: get quiz questions (no answers)
- POST /quiz/{quiz_id}/submit — Candidate submits answers
"""

import asyncio
from functools import partial

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from ..services.quiz_service import generate_quiz, get_quiz, submit_quiz, get_all_results, ensure_candidates_quizzes, HARDCODED_CANDIDATES
from ..services.email_service import send_quiz_email

router = APIRouter(prefix="/quiz", tags=["quiz"])


# ── Helper: run sync functions in thread pool ──
async def _run_sync(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    if kwargs:
        return await loop.run_in_executor(None, partial(func, *args, **kwargs))
    return await loop.run_in_executor(None, func, *args)


# ── Request Models ──

class GenerateQuizRequest(BaseModel):
    candidate_name: str
    candidate_email: str
    skills: List[str]
    user_id: str
    time_limit_minutes: int = 20


class SendEmailRequest(BaseModel):
    quiz_id: str
    candidate_name: str
    candidate_email: str
    quiz_link: str
    time_limit_minutes: int = 20


class SubmitQuizRequest(BaseModel):
    answers: dict  # {question_id: selected_option_index}


# ── Endpoints ──

@router.post("/generate")
async def api_generate_quiz(data: GenerateQuizRequest):
    """
    HR generates a skill verification quiz for a candidate.
    Uses Gemini to create 10-15 MCQ questions based on skills.
    """
    try:
        result = await _run_sync(
            generate_quiz,
            data.candidate_name,
            data.candidate_email,
            data.skills,
            data.user_id,
            data.time_limit_minutes
        )
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Quiz generation failed: {e}")
        return {"success": False, "error": str(e)}


@router.post("/send-email")
async def api_send_email(data: SendEmailRequest):
    """
    Send (simulate) a quiz invitation email to the candidate.
    """
    try:
        result = send_quiz_email(
            data.candidate_name,
            data.candidate_email,
            data.quiz_link,
            data.time_limit_minutes
        )
        return result
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return {"success": False, "error": str(e)}


@router.post("/send-all")
async def api_send_all_emails():
    """
    HR clicks one button → sends quiz links to ALL pending candidates simultaneously.
    Emails are fetched from hardcoded resume data (no manual input).
    """
    from ..utils.db import quiz_collection as qc
    sent_count = 0
    errors = []

    for candidate in HARDCODED_CANDIDATES:
        # Find their pending quiz
        quiz = qc.find_one({
            "candidate_email": candidate["email"],
            "status": {"$in": ["pending", "email_sent"]},
        })
        if not quiz:
            errors.append(f"No pending quiz for {candidate['name']}")
            continue

        quiz_link = f"http://localhost:5173/quiz/{quiz['quiz_id']}"
        try:
            send_quiz_email(
                candidate["name"],
                candidate["email"],
                quiz_link,
                quiz.get("time_limit_minutes", 20)
            )
            # Update status to email_sent
            qc.update_one(
                {"quiz_id": quiz["quiz_id"]},
                {"$set": {"status": "email_sent"}}
            )
            sent_count += 1
        except Exception as e:
            errors.append(f"Failed for {candidate['name']}: {str(e)}")

    return {
        "success": sent_count > 0,
        "sent_count": sent_count,
        "total_candidates": len(HARDCODED_CANDIDATES),
        "errors": errors,
    }


@router.get("/results")
async def api_get_results(user_id: Optional[str] = None):
    """
    HR dashboard: get all quiz results.
    Optionally filter by the HR user who created them.
    """
    try:
        results = await _run_sync(get_all_results, user_id)
        return {"success": True, "results": results}
    except Exception as e:
        print(f"❌ Failed to fetch quiz results: {e}")
        return {"success": False, "results": [], "error": str(e)}


@router.get("/{quiz_id}")
async def api_get_quiz(quiz_id: str):
    """
    Public endpoint: get quiz questions for a candidate to take.
    Does NOT include correct answers.
    """
    try:
        quiz = await _run_sync(get_quiz, quiz_id)
        if not quiz:
            return {"success": False, "error": "Quiz not found"}
        return {"success": True, **quiz}
    except Exception as e:
        print(f"❌ Failed to fetch quiz: {e}")
        return {"success": False, "error": str(e)}


@router.post("/{quiz_id}/submit")
async def api_submit_quiz(quiz_id: str, data: SubmitQuizRequest):
    """
    Candidate submits their quiz answers.
    Returns score and pass/fail status.
    """
    try:
        result = await _run_sync(submit_quiz, quiz_id, data.answers)
        if "error" in result:
            return {"success": False, **result}
        return {"success": True, **result}
    except Exception as e:
        print(f"❌ Quiz submission failed: {e}")
        return {"success": False, "error": str(e)}
