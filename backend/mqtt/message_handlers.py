from utils.logger import get_logger
from database.postgres import insert_battery, insert_mission, insert_mode, insert_obstacle, insert_position, insert_thrusters_input
from websocket_manager.websocket_manager import websocket_managers
from models.battery_model import BatteryPayload
from models.mission_model import MissionPayload
from models.mode_model import ModePayload
from models.obstacle_model import ObstaclePayload
from models.position_model import PositionPayload
from models.thrusters_input_model import ThrustersInputPayload

logger = get_logger()


async def battery_message_handler(payload: BatteryPayload):
    logger.info(f"Handling battery message: {payload}")
    await insert_battery(payload)
    await websocket_managers["battery"].broadcast(payload)
    logger.info("Battery data inserted into the database and broadcast to WebSocket clients.")

async def mission_message_handler(payload: MissionPayload):
    logger.info(f"Handling mission message: {payload}")
    await insert_mission(payload)
    await websocket_managers["mission"].broadcast(payload)
    logger.info("Mission data inserted into the database and broadcast to WebSocket clients.")

async def mode_message_handler(payload: ModePayload):
    logger.info(f"Handling mode message: {payload}")
    await insert_mode(payload)
    await websocket_managers["mode"].broadcast(payload)
    logger.info("Mode data inserted into the database and broadcast to WebSocket clients.")

async def obstacle_message_handler(payload: ObstaclePayload):
    logger.info(f"Handling obstacle message: {payload}")
    await insert_obstacle(payload)
    await websocket_managers["obstacle"].broadcast(payload)
    logger.info("Obstacle data inserted into the database and broadcast to WebSocket clients.")

async def position_message_handler(payload: PositionPayload):
    logger.info(f"Handling position message: {payload}")
    await insert_position(payload)
    await websocket_managers["position"].broadcast(payload)
    logger.info("Position data inserted into the database and broadcast to WebSocket clients.")

async def thrusters_input_message_handler(payload: ThrustersInputPayload):
    logger.info(f"Handling thrusters input message: {payload}")
    await insert_thrusters_input(payload)
    logger.info("Thrusters input data inserted into the database.")

handlers = { 
    "/boat/battery": battery_message_handler,
    "/boat/mission": mission_message_handler,
    "/boat/mode": mode_message_handler,
    "/boat/obstacle": obstacle_message_handler,
    "/boat/position": position_message_handler,
    "/boat/thrusters_input": thrusters_input_message_handler,
}