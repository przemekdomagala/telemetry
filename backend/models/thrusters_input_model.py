from pydantic import BaseModel, Field
from datetime import datetime

class ThrustersInputPayload(BaseModel):
    timestamp: datetime
    left_thruster: float = Field(ge=-100.0, le=100.0, description="left thruster input percentage")
    right_thruster: float = Field(ge=-100.0, le=100.0, description="right thruster input percentage")