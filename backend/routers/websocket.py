from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.room_manager import manager
from utils.logger import logger

router = APIRouter()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time collaboration in a specific room.
    Handles connection, incoming messages, and broadcasting updates.
    """
    logger.info(f"WebSocket connection attempt for room: {room_id}")
    connected = await manager.connect(room_id, websocket)
    if not connected:
        logger.warning(f"Connection failed during initialization for room {room_id}")
        return
    try:
        while True:
            # Wait for any message (code change) from client
            data = await websocket.receive_text()
            
            # Broadcast to others in the room
            # logger.debug(f"Received update for {room_id}") # Optional: debug level
            await manager.broadcast(room_id, data, sender=websocket)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for room: {room_id}")
        manager.disconnect(room_id, websocket)
