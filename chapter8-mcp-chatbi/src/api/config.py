import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_KEY = os.getenv("API_KEY")
MODEL = os.getenv("MODEL", "gpt-4-turbo")
BASE_URL = os.getenv("BASE_URL", "https://api.openai.com/v1")

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "chatbi")
DB_PORT = os.getenv("DB_PORT", "3306")