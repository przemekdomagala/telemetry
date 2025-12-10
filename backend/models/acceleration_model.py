from pydantic import BaseModel, Field
from datetime import datetime

class AccelerationPayload(BaseModel):
    timestamp: datetime
    acceleration: float = Field(..., description="acceleration in m/s²")