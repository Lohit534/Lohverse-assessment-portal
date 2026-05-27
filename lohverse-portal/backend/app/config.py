import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Config:
    # ── Database ──
    # MySQL 5.5.41 compatible connection string using PyMySQL
    DB_HOST     = os.getenv('DB_HOST', 'localhost')
    DB_PORT     = int(os.getenv('DB_PORT', 3306))
    DB_USER     = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME     = os.getenv('DB_NAME', 'lohverse_db')

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        "?charset=utf8"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ──
    JWT_SECRET_KEY          = os.getenv('JWT_SECRET_KEY', 'lohverse-super-secret-change-in-prod')
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── General ──
    SECRET_KEY   = os.getenv('SECRET_KEY', 'lohverse-flask-secret')
    DEBUG        = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
