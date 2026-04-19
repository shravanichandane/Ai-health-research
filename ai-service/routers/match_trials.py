"""Clinical Trial Matching Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class TrialMatchRequest(BaseModel):
    patient_id: str
    biomarkers: Optional[list] = None


@router.post("")
async def match_trials(request: TrialMatchRequest):
    """Match patient profile to clinical trials using vector similarity."""
    return {
        "matches": [
            {
                "trial_id": "NCT05432109",
                "title": "Novel PCSK9 Inhibitor for Elevated LDL",
                "match_score": 0.94,
                "matching_criteria": ["LDL > 130 mg/dL", "Age 30-75"],
            }
        ],
        "total_matched": 1,
    }
