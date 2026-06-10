from pydantic import BaseModel, Field
from datetime import datetime

class PositionPayload(BaseModel):
    timestamp: datetime
    latitude: float = Field(ge=-90.0, le=90.0, description="latitude in degrees")
    longitude: float = Field(ge=-180.0, le=180.0, description="longitude in degrees")
    heading : float = Field(ge=0.0, le=360.0, description="heading in degrees")