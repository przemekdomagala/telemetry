import json
from typing import Dict, Optional
from webrtc_signaling.client import Client
from fastapi import WebSocket, WebSocketDisconnect


async def find_unpaired_client(client_type: str, exclude_id: str, clients: Dict[str, Client]) -> Optional[Client]:
    """
    Find an unpaired client of the specified type ('sender' or 'receiver'),
    excluding the client with the given ID.
    """
    opposite_type = 'receiver' if client_type == 'sender' else 'sender'
    for client in clients.values():
        if (client.type == opposite_type
            and client.peer_id is None
            and client.id != exclude_id):
            return client
    return None


async def send_message(client: Client, event: str, data: dict):
    """
    Send a message to the specified client over its WebSocket connection.
    """
    try:
        message = {
            "event": event,
            "data": data
        }
        await client.websocket.send_text(json.dumps(message))
    except Exception as e:
        print(f"Error sending message to client {client.id}: {e}")


async def handle_identify_event(client: Client, event: str, data: dict, clients: Dict[str, Client]):
    """
    Handle the 'identify' event where a client specifies its type.
    """
    client.type = data.get("type")

    found_peer = await find_unpaired_client(client.type, client.id, clients)
    if found_peer:
        client.peer_id = found_peer.id
        found_peer.peer_id = client.id

        # Notify both clients of the pairing
        await send_message(client, "paired", {
            "peerId": found_peer.id,
            "role": client.type
        })
        await send_message(found_peer, "paired", {
            "peerId": client.id,
            "role": found_peer.type
        })


async def handle_signaling(websocket: WebSocket, client: Client, clients: Dict[str, Client]):
    data = await websocket.receive_text()
    message = json.loads(data)
    event = message.get("event")
    payload = message.get("data", {})

    if event == "identify":
        # Client identifies as 'sender' or 'receiver'
        client.type = payload.get("type")

        await handle_identify_event(client, event, payload, clients)

    elif event in ["offer", "answer", "ice-candidate"]:
        # Relay signaling messages to the peer
        if client.peer_id and client.peer_id in clients:
            peer = clients[client.peer_id]
            await send_message(peer, event, payload)

    


# async def signaling_server_websocket_endpoint(websocket: WebSocket):
#     """
#     Endpoint for WebRTC signaling
#     """

#     await websocket.accept()

#     client = Client(websocket)
#     clients[client.id] = client

#     try:
#         while True:
#             await handle_signaling(websocket, client)

#     except WebSocketDisconnect:
#         print(f"Client {client.id} disconnected")
#     except Exception as e:
#         print(f"Error in WebSocket connection for client {client.id}: {e}")
#     finally:
#         # Notify paired peer of disconnection
#         if client.peer_id and client.peer_id in clients:
#             peer = clients[client.peer_id]
#             await send_message(peer, "peer-disconnected", {})
#             peer.peer_id = None

#         # Remove client from the registry
#         del clients[client.id]