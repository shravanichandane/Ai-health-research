import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Google Gemini
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # HuggingFace (backup/BioBERT)
    HUGGINGFACE_API_KEY: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    class Config:
        env_file = ".env"

settings = Settings()
