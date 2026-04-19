"""
CuraLink AI Service — FastAPI Application
Multi-Agent Medical AI Pipeline with RAG
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings
from routers import analyze, chat, summarize, match_trials, literature

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 CuraLink AI Service starting...")
    logger.info(f"📡 Model: {settings.GEMINI_MODEL}")
    logger.info(f"🔗 Supabase: {settings.SUPABASE_URL[:30]}...")
    # Initialize embedding model and vector store on startup
    # (Lazy-loaded on first use for faster startup)
    yield
    logger.info("🛑 CuraLink AI Service shutting down...")


app = FastAPI(
    title="CuraLink AI Service",
    description="Multi-Agent Medical AI Pipeline with RAG, OCR, and Clinical Reasoning",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/analyze", tags=["Document Analysis"])
app.include_router(chat.router, prefix="/chat", tags=["RAG Chat"])
app.include_router(summarize.router, prefix="/summarize", tags=["SOAP Summary"])
app.include_router(match_trials.router, prefix="/match-trials", tags=["Trial Matching"])
app.include_router(literature.router, prefix="/literature-review", tags=["Literature Review"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "curalink-ai",
        "model": settings.GEMINI_MODEL,
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
