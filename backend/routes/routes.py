from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from datetime import datetime
from database.postgres import get_postgres
from models.battery_model import BatteryPayload
from models.mission_model import MissionPayload
from models.mode_model import ModePayload
from models.obstacle_model import ObstaclePayload
from models.position_model import PositionPayload
from models.thrusters_input_model import ThrustersInputPayload
from asyncpg import Pool


router = APIRouter()

ALLOWED_TABLES = {
    "battery",
    "mission",
    "mode",
    "obstacle",
    "position",
    "thrusters_input"
}


async def get_data_from_timerange(
    start_ts: Optional[datetime],
    end_ts: Optional[datetime],
    db: Pool,
    table_name: str
):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail=f"Invalid table name: {table_name}")
    
    if start_ts and end_ts and start_ts > end_ts:
        raise HTTPException(status_code=400, detail="start_ts must be less than or equal to end_ts")
    
    query = f"SELECT * FROM {table_name}"
    
    conditions = []
    args = []
    param_count = 1

    if start_ts:
        conditions.append(f"timestamp >= ${param_count}")
        args.append(start_ts)
        param_count += 1

    if end_ts:
        conditions.append(f"timestamp <= ${param_count}")
        args.append(end_ts)
        param_count += 1

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY timestamp DESC"

    try:
        async with db.acquire() as connection:
            rows = await connection.fetch(query, *args)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@router.get("/battery")
async def get_battery(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="battery")

    return [BatteryPayload(timestamp=row['timestamp'],
                           left_battery_voltage=row['left_battery_voltage'],
                           right_battery_voltage=row['right_battery_voltage'],
                           central_battery_voltage=row['central_battery_voltage']) for row in rows]


@router.get("/mission")
async def get_mission(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="mission")

    return [MissionPayload(timestamp=row['timestamp'],
                           description=row['description']) for row in rows]


@router.get("/mode")
async def get_mode(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="mode")

    return [ModePayload(timestamp=row['timestamp'],
                        mode=row['mode']) for row in rows]


@router.get("/obstacle")
async def get_obstacle(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="obstacle")

    return [ObstaclePayload(timestamp=row['timestamp'],
                            latitude=row['latitude'],
                            longitude=row['longitude'],
                            distance=row['distance']) for row in rows]


@router.get("/position")
async def get_position(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="position")

    return [PositionPayload(timestamp=row['timestamp'],
                            latitude=row['latitude'],
                            longitude=row['longitude'],
                            velocity=row['velocity'],
                            heading=row['heading']) for row in rows]


@router.get("/thrusters_input")
async def get_thrusters_input(
    start_ts: Optional[datetime] = Query(None, description="start timestamp for filtering"),
    end_ts: Optional[datetime] = Query(None, description="end timestamp for filtering"),
    db: Pool = Depends(get_postgres)):
    
    rows = await get_data_from_timerange(start_ts, end_ts, db, table_name="thrusters_input")

    return [ThrustersInputPayload(timestamp=row['timestamp'],
                                  left_thruster=row['left_thruster'],
                                  right_thruster=row['right_thruster']) for row in rows]


@router.get("/data-time-range")
async def get_data_time_range(db: Pool = Depends(get_postgres)):
    query = """
    SELECT
        MIN(timestamp) AS start_time,
        MAX(timestamp) AS end_time
    FROM position
    """

    try:
        async with db.acquire() as connection:
            row = await connection.fetchrow(query)
        return {
            "start_time": row['start_time'],
            "end_time": row['end_time']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    