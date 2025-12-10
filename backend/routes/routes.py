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

router = APIRouter()

ALLOWED_TABLES = {
    "battery", "mission", "mode", "obstacle", 
    "position", "thrusters_input", "acceleration"
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

    query = f"SELECT * FROM {table_name}"
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

    query += f" ORDER BY timestamp ASC LIMIT {limit} OFFSET {offset}"

    try:
        async with db.acquire() as connection:
            rows = await connection.fetch(query, *args)
            return [model(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def get_aggregated_data(
    db: Pool,
    table_name: str,
    model: Type[BaseModel],
    columns_logic: str,
    interval: str,
    start_ts: datetime,
    end_ts: datetime
) -> List[Any]:
    if not start_ts or not end_ts:
        raise HTTPException(status_code=400, detail="Start and End TS required for aggregation")

    query = f"""
    SELECT 
        time_bucket($1, timestamp) AS timestamp,
        {columns_logic}
    FROM {table_name}
    WHERE timestamp >= $2 AND timestamp <= $3
    GROUP BY timestamp
    ORDER BY timestamp ASC
    """

    try:
        async with db.acquire() as connection:
            rows = await connection.fetch(query, interval, start_ts, end_ts)
            return [model(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# region dependencies

async def common_params(
    start_ts: Optional[datetime] = Query(None),
    end_ts: Optional[datetime] = Query(None),
    limit: int = Query(10000, le=100000),
    offset: int = Query(0)
):
    return {"start_ts": start_ts, "end_ts": end_ts, "limit": limit, "offset": offset}


# region routes

@router.get("/battery", response_model=List[BatteryPayload])
async def get_battery(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "battery", BatteryPayload, **params)

@router.get("/battery/aggregated", response_model=List[BatteryPayload])
async def get_battery_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = """
        AVG(left_battery_voltage) as left_battery_voltage,
        AVG(right_battery_voltage) as right_battery_voltage,
        AVG(central_battery_voltage) as central_battery_voltage
    """
    return await get_aggregated_data(db, "battery", BatteryPayload, cols, interval, start_ts, end_ts)


@router.get("/position", response_model=List[PositionPayload])
async def get_position(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "position", PositionPayload, **params)

@router.get("/position/aggregated", response_model=List[PositionPayload])
async def get_position_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = """
        AVG(latitude) as latitude,
        AVG(longitude) as longitude,
        AVG(velocity) as velocity,
        AVG(heading) as heading
    """
    return await get_aggregated_data(db, "position", PositionPayload, cols, interval, start_ts, end_ts)


@router.get("/mode", response_model=List[ModePayload])
async def get_mode(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "mode", ModePayload, **params)

@router.get("/mode/aggregated", response_model=List[ModePayload])
async def get_mode_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = "last(mode, timestamp) as mode"
    return await get_aggregated_data(db, "mode", ModePayload, cols, interval, start_ts, end_ts)


@router.get("/thrusters_input", response_model=List[ThrustersInputPayload])
async def get_thrusters_input(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "thrusters_input", ThrustersInputPayload, **params)

@router.get("/thrusters_input/aggregated", response_model=List[ThrustersInputPayload])
async def get_thrusters_input_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = """
        AVG(left_thruster) as left_thruster,
        AVG(right_thruster) as right_thruster
    """
    return await get_aggregated_data(db, "thrusters_input", ThrustersInputPayload, cols, interval, start_ts, end_ts)


@router.get("/acceleration", response_model=List[AccelerationPayload])
async def get_acceleration(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "acceleration", AccelerationPayload, **params)

@router.get("/acceleration/aggregated", response_model=List[AccelerationPayload])
async def get_acceleration_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = "AVG(acceleration) as acceleration"
    return await get_aggregated_data(db, "acceleration", AccelerationPayload, cols, interval, start_ts, end_ts)


@router.get("/obstacle", response_model=List[ObstaclePayload])
async def get_obstacle(params: dict = Depends(common_params), db: Pool = Depends(get_postgres)):
    return await get_raw_data(db, "obstacle", ObstaclePayload, **params)

@router.get("/obstacle/aggregated", response_model=List[ObstaclePayload])
async def get_obstacle_aggregated(
    start_ts: datetime, end_ts: datetime, interval: str = Query("5 minutes"), db: Pool = Depends(get_postgres)
):
    cols = """
        first(latitude, distance) as latitude,
        first(longitude, distance) as longitude,
        MIN(distance) as distance
    """
    return await get_aggregated_data(db, "obstacle", ObstaclePayload, cols, interval, start_ts, end_ts)


@router.get("/data-time-range")
async def get_data_time_range(db: Pool = Depends(get_postgres)):
    query = "SELECT MIN(timestamp) AS start_time, MAX(timestamp) AS end_time FROM position"
    try:
        async with db.acquire() as connection:
            row = await connection.fetchrow(query)
            return row 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")