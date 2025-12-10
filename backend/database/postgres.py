import os
import asyncpg
import asyncio
from datetime import datetime
from typing import Optional
from utils.logger import get_logger

logger = get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

conn_pool: Optional[asyncpg.Pool] = None

async def init_postgres() -> None:
    """
    Initialize the PostgreSQL connection pool and create tables if they don't exist.
    """
    global conn_pool
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Initializing PostgreSQL connection pool...")

            conn_pool = await asyncpg.create_pool(
                dsn=DATABASE_URL, min_size=1, max_size=10
            )
            
            await create_all_tables()
                
            logger.info("PostgreSQL connection pool and tables created successfully.")
            return

        except Exception as e:
            logger.warning(f"PostgreSQL connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
            else:
                logger.error("Failed to connect to PostgreSQL after all retries")
                raise


async def get_postgres() -> asyncpg.Pool:
    """
    Get a reference to the PostgreSQL connection pool.

    Returns
    -------
    asyncpg.Pool
        The connection pool object to the PostgreSQL database.
    """
    global conn_pool
    if conn_pool is None:
        logger.error("Connection pool is not initialized.")
        raise ConnectionError("PostgreSQL connection pool is not initialized.")
    try:
        return conn_pool
    except Exception as e:
        logger.error(f"Failed to return PostgreSQL connection pool: {e}")
        raise


async def close_postgres() -> None:
    """
    Close the PostgreSQL connection pool.
    """
    global conn_pool
    if conn_pool is not None:
        try:
            logger.info("Closing PostgreSQL connection pool...")
            await conn_pool.close()
            logger.info("PostgreSQL connection pool closed successfully.")
        except Exception as e:
            logger.error(f"Error closing PostgreSQL connection pool: {e}")
            raise
    else:
        logger.warning("PostgreSQL connection pool was not initialized.")


# region create
async def create_battery_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS battery (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    left_battery_voltage FLOAT NOT NULL,
                    right_battery_voltage FLOAT NOT NULL,
                    central_battery_voltage FLOAT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('battery', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed battery hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_mission_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS mission (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    description TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('mission', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed mission hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_mode_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS mode (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    mode TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('mode', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed mode hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_obstacle_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS obstacle (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL,
                    distance FLOAT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('obstacle', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed obstacle hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_position_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS position (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL,
                    velocity FLOAT NOT NULL,
                    heading FLOAT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('position', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed position hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_thrusters_input_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS thrusters_input (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    left_thruster FLOAT NOT NULL,
                    right_thruster FLOAT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)

            try:
                await conn.execute("""
                    SELECT create_hypertable('thrusters_input', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed thrusters_input hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise


async def create_acceleration_table():
    async with conn_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS acceleration (
                id SERIAL,
                timestamp TIMESTAMPTZ NOT NULL,
                acceleration FLOAT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id, timestamp)
            )
        """)

        try:
            await conn.execute("""
                SELECT create_hypertable('acceleration', 'timestamp', 
                    if_not_exists => TRUE,
                    create_default_indexes => TRUE,
                    chunk_time_interval => INTERVAL '1 day'
                )
            """)
            logger.info("Created or confirmed acceleration hypertable")
        except Exception as e:
            logger.error(f"Error creating hypertable: {e}")
            raise


async def create_all_tables():
    await create_battery_table()
    await create_mission_table()
    await create_mode_table()
    await create_obstacle_table()
    await create_position_table()
    await create_thrusters_input_table()
    await create_acceleration_table()


# endregion

# region insert
async def insert_battery(payload):
    try:
        pool = await get_postgres()
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
    try:
        pool = await get_postgres()
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
    try:
        pool = await get_postgres()
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
    try:
        pool = await get_postgres()
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
    try:
        pool = await get_postgres()
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO position (timestamp, latitude, longitude, velocity, heading)
                VALUES ($1, $2, $3, $4, $5)
            """, timestamp, payload['latitude'], payload['longitude'], payload['velocity'], payload['heading'])
    except Exception as e:
        logger.error("Failed to insert position payload")
        raise


async def insert_thrusters_input(payload):
    try:
        pool = await get_postgres()
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
    try:
        pool = await get_postgres()
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO acceleration (timestamp, acceleration)
                VALUES ($1, $2)
            """, timestamp, payload['acceleration'])
    except Exception as e:
        logger.error("Failed to insert acceleration payload")
        raise



