from pydantic import BaseModel, Field
from datetime import datetime

class BatteryPayload(BaseModel):
    timestamp: datetime
    left_battery_voltage: float = Field(ge=0.0, description="left battery voltage")
    right_battery_voltage: float = Field(ge=0.0, description="right battery voltage")
    central_battery_voltage: float = Field(ge=0.0, description="central battery voltage")