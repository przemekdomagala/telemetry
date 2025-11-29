from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class Mode(Enum):
    AUTO = "AUTO"
    MANUAL = "MANUAL"
    OFF = "OFF"
    
class ModePayload(BaseModel):
    timestamp: datetime
    mode: Mode = Field(..., description="operational mode")