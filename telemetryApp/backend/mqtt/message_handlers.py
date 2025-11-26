from utils.logger import get_logger
from database.postgres import insert_velocity
from websocket_manager.websocket_manager import manager
from models.velocity_model import VelocityPayload

logger = get_logger()

async def velocity_message_handler(payload: VelocityPayload):
    logger.info(f"Handling velocity message: {payload}")
    await insert_velocity(payload)
    await manager.broadcast(payload)
    logger.info("Velocity data inserted into the database and broadcast to WebSocket clients.")

handlers = { 
    "/boat/velocity": velocity_message_handler,
}