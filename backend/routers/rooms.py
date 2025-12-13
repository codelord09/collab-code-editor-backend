from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from db.database import get_db
from db.models import Room
from schemas.common import RoomCreate, RoomResponse, AutocompleteRequest, AutocompleteResponse
from services.mock_ai import get_mock_suggestion
from utils.logger import logger

router = APIRouter()

@router.post("/rooms", response_model=RoomResponse)
async def create_room(room: RoomCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new collaboration room.
    If a custom ID is provided, it attempts to use it; otherwise generates a UUID.
    Checks if the room ID already exists to prevent duplicates.
    """
    # Generate ID if not provided
    room_id_str = room.custom_id or str(uuid.uuid4())[:8]
    logger.info(f"Attempting to create room with ID: {room_id_str}")

    # Check if exists (simple check, or rely on db constraint)
    existing = await db.execute(select(Room).where(Room.room_id == room_id_str))
    if existing.scalar_one_or_none():
         logger.warning(f"Room creation failed. ID already exists: {room_id_str}")
         raise HTTPException(status_code=400, detail="Room ID already exists")

    new_room = Room(room_id=room_id_str)
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    
    logger.info(f"Room created successfully: {room_id_str}")
    return RoomResponse(room_id=new_room.room_id)

@router.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(req: AutocompleteRequest):
    """
    Provide code completion suggestions based on the given context.
    Currently delegates to a mock AI service.
    """
    logger.info(f"Autocomplete requested for context length: {len(req.context)}")
    return await get_mock_suggestion(req.context)
