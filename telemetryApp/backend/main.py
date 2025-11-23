import logging
import os
import json
from contextlib import asynccontextmanager
from database.postgres import init_postgres, close_postgres
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes.velocity_routes import velocity_router
from mqtt_handling.mqtt_handler import fast_mqtt, wait_for_mqtt_connection
from websocket.websocket_manager import manager
from utils.logger import get_logger
from webrtc_signaling.client import Client
from typing import Dict
from webrtc_signaling.signaling_utils import handle_signaling, send_message

# logging
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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(velocity_router, prefix="/api")

@app.get("/")
async def func():
    return {"status": "ok"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "mqtt_connected": fast_mqtt.client.is_connected if hasattr(fast_mqtt, 'client') else False
    }

@app.websocket("/ws/velocity")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
        print(f"Client {client.id} disconnected")
    except Exception as e:
        print(f"Error in WebSocket connection for client {client.id}: {e}")
    finally:
        # Notify paired peer of disconnection
        if client.peer_id and client.peer_id in clients:
            peer = clients[client.peer_id]
            await send_message(peer, "peer-disconnected", {})
            peer.peer_id = None

        # Remove client from the registry
        del clients[client.id]