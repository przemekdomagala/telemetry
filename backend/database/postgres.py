import os
import asyncpg
from datetime import datetime
from typing import Optional
from utils.logger import get_logger

logger = get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

conn_pool: Optional[asyncpg.Pool] = None

async def init_postgres() -> None:
    """
    Initialize the PostgreSQL connection pool and create the velocity table if it doesn't exist.
    """
    global conn_pool
    try:
        logger.info("Initializing PostgreSQL connection pool...")

        conn_pool = await asyncpg.create_pool(
            dsn=DATABASE_URL, min_size=1, max_size=10
        )
        
        await create_velocity_table()
            
        logger.info("PostgreSQL connection pool and tables created successfully.")

    except Exception as e:
        logger.error(f"Error initializing PostgreSQL connection pool: {e}")
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
async def create_velocity_table():
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS velocity (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    velocity FLOAT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, timestamp)
                )
            """)
            
            try:
                await conn.execute("""
                    SELECT create_hypertable('velocity', 'timestamp', 
                        if_not_exists => TRUE,
                        create_default_indexes => TRUE,
                        chunk_time_interval => INTERVAL '1 day'
                    )
                """)
                logger.info("Created or confirmed velocity hypertable")
            except Exception as e:
                logger.error(f"Error creating hypertable: {e}")
                raise

# endregion

# region insert
async def insert_velocity(payload):
    try:
        pool = await get_postgres()
        async with pool.acquire() as conn:
            timestamp = datetime.fromisoformat(payload['timestamp'])
            await conn.execute("""
                INSERT INTO velocity (timestamp, velocity)
                VALUES ($1, $2)
            """, timestamp, payload['velocity'])
            logger.info("Inserted velocity payload")
    except Exception as e:
        logger.error("Failed to insert velocity payload")
        raise
