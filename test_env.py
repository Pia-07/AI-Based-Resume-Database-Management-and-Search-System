from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")  # force load

print("OPENAI:", os.getenv("OPENAI_API_KEY"))
print("MONGO :", os.getenv("MONGODB_URI"))
print("DB    :", os.getenv("MONGODB_DB_NAME"))
