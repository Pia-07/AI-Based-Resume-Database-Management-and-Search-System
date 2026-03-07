from passlib.context import CryptContext
import bcrypt as _bcrypt

# Force passlib to use bcrypt's __about__ to avoid version detection issues
if not hasattr(_bcrypt, '__about__'):
    class _About:
        __version__ = getattr(_bcrypt, '__version__', '4.0.0')
    _bcrypt.__about__ = _About()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    # Truncate to 72 bytes (bcrypt limit) - encode first, then decode back
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8', errors='ignore'))

def verify_password(password: str, hashed: str) -> bool:
    try:
        password_bytes = password.encode('utf-8')[:72]
        return pwd_context.verify(password_bytes.decode('utf-8', errors='ignore'), hashed)
    except Exception:
        # Any bcrypt error = invalid password
        return False
