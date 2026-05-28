import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:

    # ─────────────────────────────────────────────
    # DATABASE CONFIGURATION (PostgreSQL)
    # ─────────────────────────────────────────────
    # Example:
    # DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/interview_db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ─────────────────────────────────────────────
    # JWT CONFIGURATION
    # ─────────────────────────────────────────────

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-secret-key"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ─────────────────────────────────────────────
    # FLASK CONFIGURATION
    # ─────────────────────────────────────────────

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "change-this-flask-secret"
    )

    DEBUG = os.getenv(
        "FLASK_DEBUG",
        "true"
    ).lower() == "true"

    # ─────────────────────────────────────────────
    # FRONTEND URL (CORS)
    # ─────────────────────────────────────────────

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    # ─────────────────────────────────────────────
    # GEMINI API
    # ─────────────────────────────────────────────

    GEMINI_API_KEY = os.getenv(
        "GEMINI_API_KEY",
        ""
    )

    # ─────────────────────────────────────────────
    # OPTIONAL JUDGE0 API
    # ─────────────────────────────────────────────

    JUDGE0_API_KEY = os.getenv(
        "JUDGE0_API_KEY",
        ""
    )

    JUDGE0_API_URL = os.getenv(
        "JUDGE0_API_URL",
        "https://judge0-ce.p.rapidapi.com"
    )
