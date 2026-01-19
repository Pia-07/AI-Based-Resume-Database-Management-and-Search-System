<<<<<<< HEAD
from app.utils.pdf_reader import extract_text_from_pdf
from app.services.resume_parser import parse_resume_text
from app.utils.db import resume_collection

def process_and_store_resume(pdf_path, resume_id):
    raw_text = extract_text_from_pdf(pdf_path)
    parsed_data = parse_resume_text(raw_text)

    resume_doc = {
        "resume_id": resume_id,
        "personal_info": {
            "name": parsed_data["name"]
        },
        "skills": parsed_data["skills"],
        "experience": {
            "experience_years": parsed_data["experience_years"],
            "is_fresher": parsed_data["is_fresher"]
        },
        "raw_text": parsed_data["raw_text"]
    }

    resume_collection.insert_one(resume_doc)
=======
from app.utils.pdf_reader import extract_text_from_pdf
from app.services.resume_parser import parse_resume_text
from app.utils.db import resume_collection

def process_and_store_resume(pdf_path, resume_id):
    raw_text = extract_text_from_pdf(pdf_path)
    parsed_data = parse_resume_text(raw_text)

    resume_doc = {
        "resume_id": resume_id,
        "personal_info": {
            "name": parsed_data["name"]
        },
        "skills": parsed_data["skills"],
        "experience": {
            "experience_years": parsed_data["experience_years"],
            "is_fresher": parsed_data["is_fresher"]
        },
        "raw_text": parsed_data["raw_text"]
    }

    resume_collection.insert_one(resume_doc)
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
