import os
from routes.routes import router
from contextlib import asynccontextmanager
from database.postgres import init_postgres, close_postgres
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from mqtt.mqtt_handler import fast_mqtt, wait_for_mqtt_connection
from utils.logger import get_logger
from typing import Dict
from webrtc_signaling.client import Client
from webrtc_signaling.signaling_utils import handle_signaling, send_message
from websocket_manager.websocket_manager import websocket_managers, websocket_endpoint

logger = get_logger()

clients: Dict[str, Client] = {}

@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await init_postgres()
    await wait_for_mqtt_connection()
    yield
    await fast_mqtt.mqtt_shutdown()
    await close_postgres()

app = FastAPI(lifespan=_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL"),
        os.getenv("FRONTEND_LOCAL_URL"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def func():
    return {"status": "ok"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "mqtt_connected": fast_mqtt.client.is_connected if hasattr(fast_mqtt, 'client') else False
    }

@app.websocket("/ws/battery")
async def websocket_battery_endpoint(websocket: WebSocket):
    await websocket_endpoint(websocket, websocket_managers["battery"])

@app.websocket("/ws/mission")
async def websocket_mission_endpoint(websocket: WebSocket):
    await websocket_endpoint(websocket, websocket_managers["mission"])

@app.websocket("/ws/mode")
async def websocket_mode_endpoint(websocket: WebSocket):
    await websocket_endpoint(websocket, websocket_managers["mode"])

@app.websocket("/ws/obstacle")
async def websocket_obstacle_endpoint(websocket: WebSocket):
    await websocket_endpoint(websocket, websocket_managers["obstacle"])

@app.websocket("/ws/position")
async def websocket_position_endpoint(websocket: WebSocket):
    await websocket_endpoint(websocket, websocket_managers["position"])

@app.websocket("/ws/signaling")
async def signaling_server_websocket_endpoint(websocket: WebSocket):
    """
    Endpoint for WebRTC signaling
    """

    await websocket.accept()

    client = Client(websocket)
    clients[client.id] = client

    try:
        while True:
            await handle_signaling(websocket, client, clients)

    except WebSocketDisconnect:
        logger.info(f"Client {client.id} disconnected")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for client {client.id}: {e}")
    finally:
        if client.peer_id and client.peer_id in clients:
            peer = clients[client.peer_id]
            await send_message(peer, "peer-disconnected", {})
            peer.peer_id = None

        del clients[client.id]