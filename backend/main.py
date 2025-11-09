import logging
import os
import json
from contextlib import asynccontextmanager
from database.postgres import init_postgres, close_postgres
from fastapi import FastAPI
from routes.velocity_routes import velocity_router
from mqtt_handling.mqtt_handler import fast_mqtt, wait_for_mqtt_connection
from utils.logger import get_logger

# logging
logger = get_logger()

@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await init_postgres()
    await wait_for_mqtt_connection()
    yield
    await fast_mqtt.mqtt_shutdown()
    await close_postgres()

app = FastAPI(lifespan=_lifespan)
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