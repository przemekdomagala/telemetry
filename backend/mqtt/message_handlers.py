from utils.logger import get_logger
from database.postgres import insert_battery, insert_mission, insert_mode, insert_obstacle, insert_position, insert_thrusters_input, insert_acceleration
from websocket_manager.websocket_manager import websocket_managers
from models.battery_model import BatteryPayload
from models.mission_model import MissionPayload
from models.mode_model import ModePayload
from models.obstacle_model import ObstaclePayload
from models.position_model import PositionPayload
from models.thrusters_input_model import ThrustersInputPayload
from models.acceleration_model import AccelerationPayload
from database.postgres import insert_acceleration

logger = get_logger()


async def battery_message_handler(payload: BatteryPayload):
    await insert_battery(payload)
    await websocket_managers["battery"].broadcast(payload)

async def mission_message_handler(payload: MissionPayload):
    await insert_mission(payload)
    await websocket_managers["mission"].broadcast(payload)

async def mode_message_handler(payload: ModePayload):
    await insert_mode(payload)
    await websocket_managers["mode"].broadcast(payload)

async def obstacle_message_handler(payload: ObstaclePayload):
    await insert_obstacle(payload)
    await websocket_managers["obstacle"].broadcast(payload)

async def position_message_handler(payload: PositionPayload):
    await insert_position(payload)
    await websocket_managers["position"].broadcast(payload)

async def thrusters_input_message_handler(payload: ThrustersInputPayload):
    await insert_thrusters_input(payload)

async def acceleration_message_handler(payload: AccelerationPayload):
    await insert_acceleration(payload)

handlers = { 
    "/boat/battery": battery_message_handler,
    "/boat/mission": mission_message_handler,
    "/boat/mode": mode_message_handler,
    "/boat/obstacle": obstacle_message_handler,
    "/boat/position": position_message_handler,
    "/boat/thrusters_input": thrusters_input_message_handler,
    "/boat/acceleration": acceleration_message_handler,
}