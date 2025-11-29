from pydantic import BaseModel, Field
from datetime import datetime

class MissionPayload(BaseModel):
    timestamp: datetime
    description: str = Field(..., description="mission description")