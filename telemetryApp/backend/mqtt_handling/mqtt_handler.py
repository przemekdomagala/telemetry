import asyncio
import os
import json
from models.velocity_model import VelocityPayload
from database.postgres import insert_velocity
from fastapi_mqtt.config import MQTTConfig
from fastapi_mqtt.fastmqtt import FastMQTT
from utils.logger import get_logger
from websocket.websocket_manager import manager

logger = get_logger()

# Get MQTT configuration from environment variables
mqtt_host = os.getenv("MQTT_HOST", "mqtt")
mqtt_port = int(os.getenv("MQTT_PORT", "1883"))

logger.info(f"Configuring MQTT connection to {mqtt_host}:{mqtt_port}")

fast_mqtt = FastMQTT(config=MQTTConfig(
    host=mqtt_host,
    port=mqtt_port,
    keepalive=60
))

async def velocity_message_handler(payload: VelocityPayload):
    logger.info(f"Handling velocity message: {payload}")
    await insert_velocity(payload)
    await manager.broadcast(payload)
    logger.info("Velocity data inserted into the database and broadcast to WebSocket clients.")

handlers = { 
    "/boat/velocity": velocity_message_handler,
}

async def wait_for_mqtt_connection():
    """Wait for MQTT broker to be ready"""
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            await fast_mqtt.mqtt_startup()
            logger.info("Successfully connected to MQTT broker")
            return
        except Exception as e:
            logger.warning(f"MQTT connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
            else:
                logger.error("Failed to connect to MQTT broker after all retries")
                raise

@fast_mqtt.on_connect()
def connect(client, flags, rc, properties):
    fast_mqtt.client.subscribe("/boat/velocity")  
    logger.info(f"Connected: {client}, flags: {flags}, rc: {rc}, properties: {properties}")

@fast_mqtt.on_message()
async def message(client, topic, payload, qos, properties):
    try:
        payload = json.loads(payload.decode())
    except Exception as e:
        logger.error(f"Failed to decode JSON payload: {e}")
        return

    handler = handlers.get(topic)
    if handler:
        await handler(payload)
    else:
        logger.warning(f"No handler for topic: {topic}")

@fast_mqtt.subscribe("my/mqtt/topic/#")
async def message_to_topic(client, topic, payload, qos, properties):
    logger.info(f"Received message to specific topic: topic={topic}, payload={payload.decode()}, qos={qos}, properties={properties}")

@fast_mqtt.on_disconnect()
def disconnect(client, packet, exc=None):
    logger.warning(f"Disconnected: client={client}, packet={packet}, exception={exc}")

@fast_mqtt.on_subscribe()
def subscribe(client, mid, qos, properties):
    logger.info(f"Subscribed: client={client}, mid={mid}, qos={qos}, properties={properties}")