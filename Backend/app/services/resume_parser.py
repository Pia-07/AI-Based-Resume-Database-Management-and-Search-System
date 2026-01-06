def parse_resume_text(text):
    text_lower = text.lower()

    skills_db = ["python", "machine learning", "nlp", "fastapi", "react"]

    extracted_skills = [
        skill for skill in skills_db if skill in text_lower
    ]

    experience_years = 0
    if "experience" in text_lower:
        experience_years = 1  # simple assumption

    parsed_data = {
        "name": text.split("\n")[0],
        "skills": extracted_skills,
        "experience_years": experience_years,
        "is_fresher": experience_years <= 1,
        "raw_text": text
    }

    return parsed_data
