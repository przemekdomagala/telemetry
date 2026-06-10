from utils.logger import get_logger
from datetime import datetime
from database.postgres import get_postgres

logger = get_logger()

async def insert_battery(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO battery (timestamp, left_battery_voltage, right_battery_voltage, central_battery_voltage)
                VALUES ($1, $2, $3, $4)
            """, timestamp, payload['left_battery_voltage'], payload['right_battery_voltage'], payload['central_battery_voltage'])
    except Exception as e:
        logger.error("Failed to insert battery payload")
        raise


async def insert_mission(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO mission (timestamp, description)
                VALUES ($1, $2)
            """, timestamp, payload['description'])
    except Exception as e:
        logger.error("Failed to insert mission payload")
        raise


async def insert_mode(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO mode (timestamp, mode)
                VALUES ($1, $2)
            """, timestamp, payload['mode'])
    except Exception as e:
        logger.error("Failed to insert mode payload")
        raise


async def insert_obstacle(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO obstacle (timestamp, latitude, longitude, distance)
                VALUES ($1, $2, $3, $4)
            """, timestamp, payload['latitude'], payload['longitude'], payload['distance'])
    except Exception as e:
        logger.error("Failed to insert obstacle payload")
        raise


async def insert_position(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO position (timestamp, latitude, longitude, heading)
                VALUES ($1, $2, $3, $4)
            """, timestamp, payload['latitude'], payload['longitude'], payload['heading'])
    except Exception as e:
        logger.error("Failed to insert position payload")
        raise


async def insert_thrusters_input(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO thrusters_input (timestamp, left_thruster, right_thruster)
                VALUES ($1, $2, $3)
            """, timestamp, payload['left_thruster'], payload['right_thruster'])
    except Exception as e:
        logger.error("Failed to insert thrusters_input payload")
        raise


async def insert_acceleration(payload):
    pool = await get_postgres()
    try:
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO acceleration (timestamp, acceleration)
                VALUES ($1, $2)
            """, timestamp, payload['acceleration'])
    except Exception as e:
        logger.error("Failed to insert acceleration payload")
        raise


async def insert_velocity(payload):
    pool = await get_postgres()
    async with pool.acquire() as conn:
        try:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO velocity (timestamp, velocity)
                VALUES ($1, $2)
            """, timestamp, payload['velocity'])
        except Exception as e:
            logger.error("Failed to insert velocity payload")
            raise



