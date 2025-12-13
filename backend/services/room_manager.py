from typing import Dict, Set
from fastapi import WebSocket
from utils.logger import logger

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
        """
        Accepts a new WebSocket connection and adds it to the specified room.
        Initializes room state if it doesn't exist.
        Sends the current room state (code) to the new client.
        """
        await websocket.accept()
        if room_id not in self.active_connections:
            logger.info(f"Initializing new room state for room_id: {room_id}")
            self.active_connections[room_id] = set()
            self.room_states[room_id] = RoomState()
        
        self.active_connections[room_id].add(websocket)
        logger.info(f"Client connected to room {room_id}. Total clients: {len(self.active_connections[room_id])}")
        
        # Send current state to new user
        current_code = self.room_states[room_id].code
        try:
            await websocket.send_text(current_code)
            return True
        except Exception as e:
            logger.warning(f"Failed to send initial state to room {room_id}: {e}")
            self.disconnect(room_id, websocket)
            return False

    def disconnect(self, room_id: str, websocket: WebSocket):
        """
        Removes a WebSocket connection from a room.
        Logs the disconnection and the remaining client count.
        """
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            logger.info(f"Client disconnected from room {room_id}. Remaining clients: {len(self.active_connections[room_id])}")
            if not self.active_connections[room_id]:
                # Optional: Cleanup empty room state? 
                # Keeping it allows state persistence until server restart
                logger.info(f"Room {room_id} is now empty.")
                pass

    async def broadcast(self, room_id: str, message: str, sender: WebSocket):
        """
        Broadcasts a message (code update) to all other clients in the room.
        Updates the server-side room state with the new code.
        """
        # Update state
        if room_id in self.room_states:
             self.room_states[room_id].code = message

        if room_id in self.active_connections:
            # Iterate over a copy to allow safe removal during iteration
            for connection in list(self.active_connections[room_id]):
                if connection != sender:
                    try:
                        await connection.send_text(message)
                    except RuntimeError as e:
                        # Catch "Cannot call 'send' once a close message has been sent"
                        logger.warning(f"Connection closed during broadcast in room {room_id}, removing client.")
                        self.disconnect(room_id, connection)
                    except Exception as e:
                        logger.error(f"Error broadcasting to client in room {room_id}: {e}")

manager = ConnectionManager()
