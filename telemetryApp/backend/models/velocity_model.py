from pydantic import BaseModel, Field
from datetime import datetime

class VelocityPayload(BaseModel):
    timestamp: datetime
    velocity: float = Field(ge=0.0, description="velocity in m/s")
