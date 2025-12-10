from pydantic import BaseModel
from typing import Optional

class RoomCreate(BaseModel):
    # Optional custom ID, otherwise auto-generated
    custom_id: Optional[str] = None

class RoomResponse(BaseModel):
    room_id: str

class AutocompleteRequest(BaseModel):
    context: str
    cursor_position: int

class AutocompleteResponse(BaseModel):
    suggestion: str
