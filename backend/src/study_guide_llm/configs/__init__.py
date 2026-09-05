from dotenv import load_dotenv
import os

load_dotenv()

APP_ENV = os.getenv("APP_ENV")

DEFAULT_IMAGE = os.getenv("DEFAULT_IMAGE")

DB_URI = os.getenv("DB_URI")

SECRET_KEY = os.getenv("SECRET_KEY")

MAX_AGE = os.getenv("MAX_AGE")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_SALT = os.getenv("MAIL_SALT")

FRONTEND_URI = os.getenv("FRONTEND_URI")
BACKEND_URI = os.getenv("BACKEND_URI")

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

MODEL_NAME = os.getenv("MODEL_NAME")