# Collaborative Code Editor

A real-time collaborative code editor built with Python (FastAPI) and React.

## Features
- Real-time code synchronization using WebSockets.
- multiple rooms support.
- AI-powered autocomplete mock.
- Persistent room metadata with PostgreSQL.

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (or adjust `DATABASE_URL` in `backend/db/database.py`)

## Setup & Running

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (manual list for now as requirements.txt wasn't requested but is good practice)
pip install fastapi uvicorn websockets sqlalchemy asyncpg pydantic

# Run Server
# Ensure Postgres is running or update DATABASE_URL
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run Dev Server
npm run dev
```

## Architecture

- **Backend**: FastAPI manages REST endpoints (`/rooms`, `/autocomplete`) and WebSocket connections (`/ws/{roomId}`). State is broadcasted to all connected clients in a room.
- **Frontend**: React app using `WebSocket` API to listen for updates and send changes on keystroke.
- **Database**: Stores room existence. Code content is currently ephemeral (in-memory) per instructions, but easily extensible to DB preservation.
