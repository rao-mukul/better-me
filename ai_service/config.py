import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MONGODB_URI = os.getenv("MONGODB_URI", "")
CLIENT_ORIGIN = os.getenv("CLIENT_ORIGIN", "")
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "default_user")
