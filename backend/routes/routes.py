from asyncpg import Pool
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, Type, List, Any
from datetime import datetime
from database.postgres import get_postgres
from pydantic import BaseModel
from models.battery_model import BatteryPayload
from models.mission_model import MissionPayload
from models.mode_model import ModePayload
from models.obstacle_model import ObstaclePayload
from models.position_model import PositionPayload
from models.thrusters_input_model import ThrustersInputPayload
from models.acceleration_model import AccelerationPayload
from models.velocity_model import VelocityPayload

router = APIRouter()

ALLOWED_TABLES = {
    "battery", "mission", "mode", "obstacle", 
    "position", "thrusters_input", "acceleration", "velocity"
}

# region utils

async def get_raw_data(
    db: Pool,
    table_name: str,
    model: Type[BaseModel],
    start_ts: Optional[datetime],
    end_ts: Optional[datetime],
    limit: int,
    offset: int
) -> List[Any]:
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail=f"Invalid table name: {table_name}")

    if start_ts and end_ts and start_ts > end_ts:
        raise HTTPException(status_code=400, detail="start_ts must be less than or equal to end_ts")

    query = f'SELECT * FROM "{table_name}"'
    conditions = []
    args = []
    param_id = 1

    if start_ts:
        conditions.append(f"timestamp >= ${param_id}")
        args.append(start_ts)
        param_id += 1
    if end_ts:
        conditions.append(f"timestamp <= ${param_id}")
        args.append(end_ts)
        param_id += 1

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += f" ORDER BY timestamp ASC LIMIT ${param_id} OFFSET ${param_id+1}"
    args.append(limit)
    args.append(offset)

    try:
        async with db.acquire() as connection:
            rows = await connection.fetch(query, *args)
            return [model(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def common_params(
    start_ts: Optional[datetime] = Query(None),
    end_ts: Optional[datetime] = Query(None),
    limit: int = Query(10000, le=100000),
    offset: int = Query(0)
):
    return {"start_ts": start_ts, "end_ts": end_ts, "limit": limit, "offset": offset}



@router.get("/battery", response_model=List[BatteryPayload])
async def get_battery(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "battery", BatteryPayload, **params)

@router.get("/position", response_model=List[PositionPayload])
async def get_position(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "position", PositionPayload, **params)

@router.get("/mode", response_model=List[ModePayload])
async def get_mode(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "mode", ModePayload, **params)

@router.get("/thrusters_input", response_model=List[ThrustersInputPayload])
async def get_thrusters_input(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "thrusters_input", ThrustersInputPayload, **params)

@router.get("/acceleration", response_model=List[AccelerationPayload])
async def get_acceleration(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "acceleration", AccelerationPayload, **params)

@router.get("/obstacle", response_model=List[ObstaclePayload])
async def get_obstacle(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "obstacle", ObstaclePayload, **params)

@router.get("/velocity", response_model=List[VelocityPayload])
async def get_velocity(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "velocity", VelocityPayload, **params)

@router.get("/data-time-range")
async def get_data_time_range(db: Pool = Depends(get_postgres)):
    query = """
    SELECT 
        MIN(timestamp) AS start_time, 
        MAX(timestamp) AS end_time 
    FROM (
        SELECT timestamp FROM battery
        UNION ALL SELECT timestamp FROM position
        UNION ALL SELECT timestamp FROM mode
        UNION ALL SELECT timestamp FROM thrusters_input
        UNION ALL SELECT timestamp FROM acceleration
        UNION ALL SELECT timestamp FROM obstacle
    ) AS all_timestamps
    """
    try:
        async with db.acquire() as connection:
            row = await connection.fetchrow(query)
            return row 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")