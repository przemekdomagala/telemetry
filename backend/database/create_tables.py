from utils.logger import get_logger

logger = get_logger()

async def create_battery_table(conn_pool):
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


async def create_mission_table(conn_pool):
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


async def create_mode_table(conn_pool):
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


async def create_obstacle_table(conn_pool):
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


async def create_position_table(conn_pool):
        async with conn_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS position (
                    id SERIAL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL,
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


async def create_thrusters_input_table(conn_pool):
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


async def create_acceleration_table(conn_pool):
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


async def create_velocity_table(conn_pool):
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

async def create_all_tables(conn_pool):
    await create_battery_table(conn_pool)
    await create_mission_table(conn_pool)
    await create_mode_table(conn_pool)
    await create_obstacle_table(conn_pool)
    await create_position_table(conn_pool)
    await create_thrusters_input_table(conn_pool)
    await create_acceleration_table(conn_pool)
    await create_velocity_table(conn_pool)