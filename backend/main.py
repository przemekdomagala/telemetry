from contextlib import asynccontextmanager
import asyncio
import logging
import os
from fastapi import FastAPI
from fastapi_mqtt.config import MQTTConfig
from fastapi_mqtt.fastmqtt import FastMQTT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get MQTT configuration from environment variables
mqtt_host = os.getenv("MQTT_HOST", "mqtt")
mqtt_port = int(os.getenv("MQTT_PORT", "1883"))

logger.info(f"Configuring MQTT connection to {mqtt_host}:{mqtt_port}")

fast_mqtt = FastMQTT(config=MQTTConfig(
    host=mqtt_host,
    port=mqtt_port,
    keepalive=60
))

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

@asynccontextmanager
async def _lifespan(_app: FastAPI):
    await wait_for_mqtt_connection()
    yield
    await fast_mqtt.mqtt_shutdown()

app = FastAPI(lifespan=_lifespan)

@fast_mqtt.on_connect()
def connect(client, flags, rc, properties):
    fast_mqtt.client.subscribe("/mqtt")  # subscribing mqtt topic
    logger.info(f"Connected: {client}, flags: {flags}, rc: {rc}, properties: {properties}")

@fast_mqtt.on_message()
async def message(client, topic, payload, qos, properties):
    logger.info(f"Received message: topic={topic}, payload={payload.decode()}, qos={qos}, properties={properties}")
    return 0

@fast_mqtt.subscribe("my/mqtt/topic/#")
async def message_to_topic(client, topic, payload, qos, properties):
    logger.info(f"Received message to specific topic: topic={topic}, payload={payload.decode()}, qos={qos}, properties={properties}")

@fast_mqtt.on_disconnect()
def disconnect(client, packet, exc=None):
    logger.warning(f"Disconnected: client={client}, packet={packet}, exception={exc}")

@fast_mqtt.on_subscribe()
def subscribe(client, mid, qos, properties):
    logger.info(f"Subscribed: client={client}, mid={mid}, qos={qos}, properties={properties}")

@app.get("/")
async def func():
    return {"status": "ok"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "mqtt_connected": fast_mqtt.client.is_connected if hasattr(fast_mqtt, 'client') else False
    }