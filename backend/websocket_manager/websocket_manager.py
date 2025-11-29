from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from utils.logger import get_logger

logger = get_logger()

class WebSocketManager:
    def __init__(self, name: str = "default"):
        self.name = name
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"[{self.name}] New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"[{self.name}] WebSocket disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"[{self.name}] Error sending message: {e}")
                disconnected.add(connection)
        
        for connection in disconnected:
            self.disconnect(connection)


async def websocket_endpoint(websocket: WebSocket, manager: WebSocketManager):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  
    except WebSocketDisconnect:
        manager.disconnect(websocket) 


battery_manager = WebSocketManager("battery")
mission_manager = WebSocketManager("mission")
mode_manager = WebSocketManager("mode")
obstacle_manager = WebSocketManager("obstacle")
position_manager = WebSocketManager("position")


websocket_managers = {
    "battery": battery_manager,
    "mission": mission_manager,
    "mode": mode_manager,
    "obstacle": obstacle_manager,
    "position": position_manager,
}