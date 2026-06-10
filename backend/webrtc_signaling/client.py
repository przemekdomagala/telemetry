from fastapi import WebSocket
from typing import Optional

class Client:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.type: Optional[str] = None
        self.peer_id: Optional[str] = None
        self.id: str = str(id(websocket))