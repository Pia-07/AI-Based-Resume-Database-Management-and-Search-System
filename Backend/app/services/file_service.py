"""
Local File Storage Service
Replaces S3 service with local file storage for resume PDFs.
"""
import os
import shutil
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Local uploads directory
LOCAL_UPLOADS_DIR = os.getenv("LOCAL_UPLOADS_DIR", "uploads")
os.makedirs(LOCAL_UPLOADS_DIR, exist_ok=True)


def save_pdf_locally(file_path: str, file_key: str) -> str:
    """
    Save a PDF file to local storage.
    
    Args:
        file_path: Path to the source PDF file
        file_key: Key/path for storing the file (e.g., 'resumes/uuid.pdf')
    
    Returns:
        URL path to access the file (served by FastAPI StaticFiles)
    """
    dest_path = os.path.join(LOCAL_UPLOADS_DIR, file_key)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    shutil.copy(file_path, dest_path)
    
    # Return a path that will be served by FastAPI's StaticFiles mount
    return f"/files/{file_key}"


def get_file_url(file_key: str) -> str:
    """
    Get the URL for accessing a stored file.
    
    Args:
        file_key: Key/path of the stored file
    
    Returns:
        URL path to access the file
    """
    return f"/files/{file_key}"


def delete_file(file_key: str) -> bool:
    """
    Delete a file from local storage.
    
    Args:
        file_key: Key/path of the file to delete
    
    Returns:
        True if file was deleted, False if not found
    """
    file_path = os.path.join(LOCAL_UPLOADS_DIR, file_key)
    if os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False


def file_exists(file_key: str) -> bool:
    """
    Check if a file exists in local storage.
    
    Args:
        file_key: Key/path of the file
    
    Returns:
        True if file exists
    """
    file_path = os.path.join(LOCAL_UPLOADS_DIR, file_key)
    return os.path.exists(file_path)


def get_file_path(file_key: str) -> Optional[str]:
    """
    Get the absolute local path of a stored file.
    
    Args:
        file_key: Key/path of the file
    
    Returns:
        Absolute path if file exists, None otherwise
    """
    file_path = os.path.join(LOCAL_UPLOADS_DIR, file_key)
    if os.path.exists(file_path):
        return os.path.abspath(file_path)
    return None
