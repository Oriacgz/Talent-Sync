# WHO WRITES THIS: Backend developer / ML developer
# WHAT THIS DOES: Response shape for match score data including SHAP values.
# DEPENDS ON: pydantic

from pydantic import BaseModel
from typing import Optional
class MatchResponse(BaseModel):
    id: int
    student_id: int
    job_id: int
    hybrid_score: float
    semantic_score: float
    academic_score: float
    preference_score: float
    shap_values: Optional[dict] = None
    class Config:
        from_attributes = True