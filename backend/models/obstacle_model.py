from pydantic import BaseModel, Field
from datetime import datetime

class ObstaclePayload(BaseModel):
    timestamp: datetime
    latitude: float = Field(ge=-90.0, le=90.0, description="latitude in degrees")
    longitude: float = Field(ge=-180.0, le=180.0, description="longitude in degrees")
    distance: float = Field(ge=0.0, description="distance to obstacle in meters")