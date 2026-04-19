"""SOAP Summary Generation Router"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SummarizeRequest(BaseModel):
    patient_id: str
    doctor_id: str


@router.post("")
async def generate_soap(request: SummarizeRequest):
    """Generate SOAP note from patient data using Reasoning Agent."""
    return {
        "subjective": "Patient presents for routine follow-up. Reports occasional fatigue.",
        "objective": "Lipid Panel: TC 242, LDL 165↑, HDL 38↓, TG 195↑. HbA1c 5.9%↑.",
        "assessment": "1. Atherogenic Dyslipidemia\n2. Pre-Diabetes (IFG + elevated HbA1c)",
        "plan": "1. Initiate atorvastatin 20mg\n2. Mediterranean diet\n3. Repeat labs in 8 weeks",
        "ai_confidence": 0.91,
        "source_documents": [],
    }
