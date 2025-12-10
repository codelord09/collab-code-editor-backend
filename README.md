# Collaborative Code Editor

A real-time collaborative code editor built with Python (FastAPI) and React, designed to meet the requirements of a modern pair-programming tool.

## Features
- **Real-Time Synchronization**: Seamless code editing between multiple users using WebSockets.
- **Room Management**: Create unique rooms or join existing ones via URL (e.g., `/room/xyz`).
- **AI Autocomplete**: Auto-triggered mock AI suggestions after 600ms of inactivity.
- **Persistent Metadata**: Room creation events are logged in PostgreSQL.
- **Premium UI**: Dark-themed, responsive interface with a focus on developer experience.

## Architecture & Design Choices

### Backend (FastAPI)
- **Framework**: FastAPI was chosen for its high performance (Asynchronous IO) and native WebSocket support.
- **Protocol**: WebSockets (`/ws/{roomId}`) handle the real-time bidirectional communication required for the editor.
- **State Management**: 
  - **In-Memory**: Active room code state is held in memory (`RoomManager`) for millisecond-latency access. This fits the "prototype" scope where speed is prioritized over complex persistence strategies.
  - **Database**: PostgreSQL is used to store room metadata (`Room` model), establishing a foundation for future persistence features.
- **Routing**: Clean separation of concerns with dedicated routers for `rooms` (REST) and `websocket` (Real-time).

### Frontend (React + Vite)
- **State**: React's local state manages the editor content, while `useEffect` hooks handle WebSocket events (`onmessage`, `onopen`).
- **Optimization**: 
  - **Debouncing**: The AI autocomplete API call is debounced by 600ms to prevent API flooding and ensure a smooth user experience.
  - **CSS**: Custom vanilla CSS variables (dark mode) are used for a lightweight, performant, and consistent design system without the overhead of heavy UI libraries.

## Setup & Running

### Prerequisites
- Python 3.9+
- Node.js (v18+)
- PostgreSQL (running locally)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn websockets sqlalchemy asyncpg pydantic greenlet

# Ensure PostgreSQL is running and update database.py if needed
# Default: postgresql+asyncpg://user:password@localhost/collab_db

# Run the server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run the development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Improvements & Enhancements (Evaluation Criteria)

While this prototype meets the core requirements, several enhancements would make it production-ready:

### 1. Robust Persistence (Redis)
**Current Limitation**: Code state is stored in Python memory. If the server restarts, code is lost.
**Improvement**: Use **Redis** to store the active state of each room. This allows the backend to be stateless and scalable across multiple worker processes.

### 2. Operational Transformation (OT) or CRDTs
**Current Limitation**: The "Last-Write-Wins" approach works for simple concurrency but can overwrite changes if two users type exactly simultaneously.
**Improvement**: Implement **Yjs** or **Automerge** (CRDTs) to handle complex merging of concurrent edits conflict-free.

### 3. Authentication & Security
**Current Limitation**: Anyone with a room ID can join.
**Improvement**: Add JWT-based authentication. Allow room creators to set passwords or "Invite Only" modes.

### 4. Code Execution
**Enhancement**: Add a backend sandbox (Docker/gVisor) to safely execute the Python code written in the editor and return the output to the client.

### 5. Testing
**Current Status**: Manual verification.
**Improvement**: Add `pytest` for backend unit tests (especially WebSocket logic) and `Jest/React Testing Library` for frontend component tests.
