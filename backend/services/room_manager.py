from typing import Dict, Set
from fastapi import WebSocket
from ..utils.logger import logger

class RoomState:
    def __init__(self):
        self.code: str = ""
        # Could add active_users, last_updated, etc. here

class ConnectionManager:
    def __init__(self):
        # roomId -> list of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # roomId -> RoomState
        self.room_states: Dict[str, RoomState] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            logger.info(f"Initializing new room state for room_id: {room_id}")
            self.active_connections[room_id] = set()
            self.room_states[room_id] = RoomState()
        
        self.active_connections[room_id].add(websocket)
        logger.info(f"Client connected to room {room_id}. Total clients: {len(self.active_connections[room_id])}")
        
        # Send current state to new user
        current_code = self.room_states[room_id].code
        await websocket.send_text(current_code)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            logger.info(f"Client disconnected from room {room_id}. Remaining clients: {len(self.active_connections[room_id])}")
            if not self.active_connections[room_id]:
                # Optional: Cleanup empty room state? 
                # Keeping it allows state persistence until server restart
                logger.info(f"Room {room_id} is now empty.")
                pass

    async def broadcast(self, room_id: str, message: str, sender: WebSocket):
        # Update state
        if room_id in self.room_states:
             self.room_states[room_id].code = message

        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != sender:
                    await connection.send_text(message)

manager = ConnectionManager()
