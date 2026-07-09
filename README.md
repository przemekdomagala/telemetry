# Autonomous-Boat-Telemetry

Full-stack telemetry platform for the **Barka** autonomous solar boat (AGH Solar Boat). Receives sensor data from the boat over MQTT, stores it in a time-series database, and presents it in a React web dashboard - both live and as historical analysis.

The onboard data producer is [**Autonomous-Boat-Telemetry-Handler**](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler) - a ROS 2 workspace that bridges CAN bus / GNSS / IMU data to the MQTT topics this platform consumes.

---

## Features

- **Live dashboard** - real-time battery voltages, GPS map, velocity, obstacles, mission state, and operational mode
- **Live camera** - WebRTC stream from the boat's ZED stereo camera
- **Historic dashboard** - time-range queries with charts, trail maps, and CSV export
- **WebSocket broadcast** - sub-second latency from MQTT ingestion to browser update
- **Time-series storage** - TimescaleDB hypertables with 1-day chunks, queryable over arbitrary time ranges

---

## Architecture

```
┌───────────────────────────────┐
│  Autonomous-Boat-Telemetry-   │
│  Handler (ROS 2 on boat)      │
│                               │
│  telemetry_handler ──────────►│ MQTT /boat/* (SSL :8883)
│  webrtc_client ──────────────►│ WebSocket /ws/signaling
└───────────────────────────────┘
              │                │
              ▼                ▼
┌─────────────────────────────────────────────────────┐
│                FastAPI Backend (:8000)               │
│                                                     │
│  mqtt_handler ──► message_handlers ──► DB insert    │
│                                    └──► WS broadcast│
│                                                     │
│  REST  /api/*  ◄─── historic queries                │
│  WS    /ws/*   ◄─── live telemetry                  │
│  WS    /ws/signaling ◄──► WebRTC peer pairing       │
└─────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│              TimescaleDB (:5432)                    │
│  8 hypertables: battery, position, mode, obstacle,  │
│  velocity, mission, thrusters_input, acceleration   │
└─────────────────────────────────────────────────────┘
              ▲
              │ REST / WebSocket
┌─────────────────────────────────────────────────────┐
│             React Frontend (:5173)                  │
│  / ──► Live Dashboard   (WebSocket + WebRTC)        │
│  /historic ──► Historic Dashboard  (REST API)       │
└─────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
Autonomous-Boat-Telemetry/
├── docker-compose.yml
├── mosquitto.conf                 # Local Mosquitto config (optional, not in compose)
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                    # FastAPI app, lifespan, WebSocket routes
│   ├── routes/
│   │   └── routes.py              # REST endpoints for historic data
│   ├── mqtt/
│   │   ├── mqtt_handler.py        # MQTT client, connection, subscriptions
│   │   └── message_handlers.py   # Topic → DB insert + WS broadcast
│   ├── websocket_manager/
│   │   └── websocket_manager.py  # Broadcast managers per telemetry type
│   ├── webrtc_signaling/
│   │   ├── client.py             # Peer model
│   │   └── signaling_utils.py    # Pairing and SDP/ICE relay
│   ├── database/
│   │   ├── postgres.py           # asyncpg connection pool
│   │   ├── create_tables.py      # Hypertable creation
│   │   └── insert_data.py        # INSERT helpers
│   ├── models/                   # Pydantic models (one per telemetry type)
│   └── utils/
│       └── logger.py             # loguru logger
│
└── frontend/
    ├── Dockerfile
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── hooks/                 # useWebSocket, useWebRTC, useHistoricData…
        ├── utils/
        │   └── csvExport.js
        └── components/
            ├── Navbar.jsx
            ├── liveDashboard/     # Dashboard, MapDisplay, BatteryPlot…
            └── historicDashboard/ # HistoricData, MapHistoric, charts…
```

---

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

No other local dependencies are required - everything runs in containers.

---

## Configuration

Create a `.env` file in the project root (it is gitignored). Use the table below as a guide:

```dotenv
# Database
POSTGRES_USER=telemetry
POSTGRES_PASSWORD=changeme
POSTGRES_DB=telemetry

# MQTT broker
MQTT_HOST=broker.hivemq.com      # or your private broker
MQTT_PORT=8883
MQTT_USERNAME=                   # optional
MQTT_PASSWORD=                   # optional
MQTT_USE_TLS=true

# CORS - set to your actual frontend origin(s)
FRONTEND_URL=http://localhost:5173
FRONTEND_LOCAL_URL=http://localhost:5173

# Frontend environment (Vite)
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

> **Note:** `MQTT_HOST` should match the broker configured in [Autonomous-Boat-Telemetry-Handler](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler). Both sides must point to the same broker (and use the same `TOPIC_HASH` prefix if configured).

---

## Running

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| React dashboard | http://localhost:5173 |
| FastAPI backend | http://localhost:8000 |
| TimescaleDB | `localhost:5432` |

On first start, the backend creates all TimescaleDB hypertables automatically.

### Development (without Docker)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## REST API

All endpoints accept the following query parameters (where applicable):

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_ts` | ISO 8601 string | - | Start of time range |
| `end_ts` | ISO 8601 string | - | End of time range |
| `limit` | int | 10 000 | Max rows (max 100 000) |
| `offset` | int | 0 | Pagination offset |

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Status + MQTT connection state |
| `/api/battery` | GET | Battery voltage history |
| `/api/position` | GET | GPS position history |
| `/api/mode` | GET | Operational mode history |
| `/api/obstacle` | GET | Obstacle detection history |
| `/api/velocity` | GET | Velocity history |
| `/api/thrusters_input` | GET | Thruster setpoints history |
| `/api/acceleration` | GET | Acceleration history |
| `/api/data-time-range` | GET | Earliest and latest timestamps across all tables |

---

## WebSocket Endpoints

Connect to receive a live JSON stream for each telemetry type. Messages match the MQTT payload schemas published by [Autonomous-Boat-Telemetry-Handler](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler).

| Path | Live data |
|------|-----------|
| `/ws/battery` | Battery voltages |
| `/ws/position` | GPS position + heading |
| `/ws/mode` | Operational mode |
| `/ws/obstacle` | Obstacle detections |
| `/ws/velocity` | Velocity |
| `/ws/mission` | Mission description |
| `/ws/signaling` | WebRTC signaling (camera stream pairing) |

---

## MQTT Topics Consumed

The backend subscribes to the following topics on startup. These are published by [Autonomous-Boat-Telemetry-Handler](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler).

| Topic | JSON fields |
|-------|-------------|
| `/boat/battery` | `timestamp`, `left_battery_voltage`, `right_battery_voltage`, `central_battery_voltage` |
| `/boat/position` | `timestamp`, `latitude`, `longitude`, `heading` |
| `/boat/mode` | `timestamp`, `mode` (`OFF` \| `MANUAL` \| `AUTO`) |
| `/boat/obstacle` | `timestamp`, `latitude`, `longitude`, `distance` |
| `/boat/mission` | `timestamp`, `description` |
| `/boat/thrusters_input` | `timestamp`, `left_thruster`, `right_thruster` |
| `/boat/acceleration` | `timestamp`, `acceleration` |
| `/boat/velocity` | `timestamp`, `velocity` |

---

## WebRTC Camera Stream

The live dashboard displays a real-time camera feed from the boat's ZED camera using WebRTC peer-to-peer data channels.

```
webrtc_client (on boat) ──► /ws/signaling ◄── React dashboard
         sender                                    receiver
              └──────── WebRTC data channel ───────┘
                         (JPEG frames)
```

The backend acts purely as a **signaling relay** - it pairs a `sender` (boat) with a `receiver` (browser) and relays SDP offers/answers and ICE candidates. Actual media travels directly peer-to-peer.

| Setting | Value |
|---------|-------|
| Signaling path | `/ws/signaling` |
| STUN servers | `stun.l.google.com:19302`, `stun1.l.google.com:19302` |
| Data channel | `images` |
| Image format | JPEG base64 data URI |

The boat-side sender is part of [Autonomous-Boat-Telemetry-Handler](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler) (`webrtc_client/`).

---

## Database Schema

Eight TimescaleDB hypertables, each with a 1-day chunk interval and composite primary key `(id, timestamp)`:

| Table | Key columns |
|-------|-------------|
| `battery` | `timestamp`, `left_battery_voltage`, `right_battery_voltage`, `central_battery_voltage` |
| `position` | `timestamp`, `latitude`, `longitude`, `heading` |
| `mode` | `timestamp`, `mode` |
| `obstacle` | `timestamp`, `latitude`, `longitude`, `distance` |
| `mission` | `timestamp`, `description` |
| `velocity` | `timestamp`, `velocity` |
| `thrusters_input` | `timestamp`, `left_thruster`, `right_thruster` |
| `acceleration` | `timestamp`, `acceleration` |

---

## Frontend Pages

### Live Dashboard (`/`)

| Panel | Data source |
|-------|-------------|
| Camera stream | WebRTC data channel |
| Map | `/ws/position` + `/ws/obstacle` (trail: last 10 points) |
| Battery chart | `/ws/battery` (rolling 5-minute window) |
| Position / velocity readout | `/ws/position`, `/ws/velocity` |
| Mode indicator | `/ws/mode` (green = AUTO, yellow = MANUAL, red = OFF) |
| Mission text | `/ws/mission` |

Default map center: **50.0328°N, 19.9905°E** (Kraków).

### Historic Dashboard (`/historic`)

Time-range picker with 1 h / 6 h / 24 h presets or a custom range. Charts rendered on HTML canvas; trail on Leaflet map. All data exportable as CSV.

| Chart | REST endpoint |
|-------|---------------|
| Battery voltages | `/api/battery` |
| Velocity | `/api/velocity` |
| Operational mode | `/api/mode` |
| Thruster setpoints | `/api/thrusters_input` |
| Acceleration | `/api/acceleration` |
| GPS trail | `/api/position` |
| Obstacle detections | `/api/obstacle` |

---

## Connection to Autonomous-Boat-Telemetry-Handler

This repository is the **consumer** side. For the full system to work you need the companion onboard workspace:

> **[Autonomous-Boat-Telemetry-Handler](https://github.com/AGH-Solar-Boat/Autonomous-Boat-Telemetry-Handler)** - ROS 2 workspace that reads CAN bus, GNSS, IMU, and obstacle data from the boat and publishes it to the MQTT topics above. It also runs the WebRTC camera sender that connects to `/ws/signaling`.

Both sides must share the same:
- **MQTT broker** host, port, and credentials
- **Topic prefix** (`TOPIC_HASH` in the handler = matching subscription prefix here)
- **Signaling server URL** - the handler's `SIGNALING_SERVER` must point to this backend's `/ws/signaling`

---

## Maintainer

Przemysław Domagała - [przemyslaw.domagala@solarboat.agh.edu.pl](mailto:przemyslaw.domagala@solarboat.agh.edu.pl)  
AGH Solar Boat, Kraków
