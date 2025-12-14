# Project Structure and Architecture

This document visualizes the structure and behavior of the **Collaborative Code Editor** application.

## 1. High-Level Architecture
The application consists of a React/Vite frontend and a FastAPI backend, communicating via REST APIs and WebSockets.

```mermaid
graph TD
    Client[Frontend Client<br/>React + Vite]
    
    subgraph Backend [FastAPI Backend]
        API[API Router]
        WS[WebSocket Manager]
        Services[Business Logic & Services]
    end
    
    DB[(PostgreSQL Database)]
    
    Client -- "HTTP POST (Create Room, Autocomplete)" --> API
    Client -- "WebSocket (Real-time Code)" --> WS
    
    API --> Services
    WS --> Services
    
    API -- "Read/Write Room Meta" --> DB
```

## 2. Backend Class and Component Diagram
This diagram details the relationships between the models, schemas, routers, and services in the backend.

```mermaid
classDiagram
    class RoomCreate {
        +String custom_id
    }
    class RoomResponse {
        +String room_id
    }
    class AutocompleteRequest {
        +String context
        +int cursor_position
    }
    
    class Room {
        +int id
        +String room_id
        +DateTime created_at
    }
    
    class RoomState {
        +String code
    }
    
    class ConnectionManager {
        +Dictionary active_connections
        +Dictionary room_states
        +connect(room_id, ws)
        +disconnect(room_id, ws)
        +broadcast(room_id, msg, sender)
    }

    note for ConnectionManager "Manages in-memory state<br/>of active coding sessions"

    %% Relationships
    RoomCreate ..> Room : creates
    ConnectionManager *-- RoomState : manages
    
    %% Router dependencies
    class RoomsRouter {
        +create_room()
        +autocomplete()
    }
    class WebsocketRouter {
        +websocket_endpoint()
    }

    RoomsRouter ..> RoomCreate : uses
    RoomsRouter ..> Room : saves to DB
    WebsocketRouter ..> ConnectionManager : uses
```

## 3. Sequence Diagrams

### 3.1 Room Creation Flow
User creates a room via the frontend.

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant DB as Database

    U->>FE: Click "Create Room"
    FE->>API: POST /rooms (custom_id?)
    API->>DB: Check if exists
    alt Exists
        DB-->>API: Found
        API-->>FE: 400 Error
    else New
        API->>DB: Insert new Room
        DB-->>API: Success
        API-->>FE: Returns {room_id}
    end
    FE->>U: Redirect to /room/{room_id}
```

### 3.2 WebSocket Connection & Collaboration
User joins a room and starts typing.

```mermaid
sequenceDiagram
    participant U as User A
    participant FE as Frontend A
    participant WS as WebSocket Endpoint
    participant CM as ConnectionManager
    participant U2 as User B (Frontend B)

    %% Connection
    U->>FE: Open Room URL
    FE->>WS: Connect ws://.../ws/{room_id}
    WS->>CM: connect(room_id, ws)
    CM-->>WS: Accept
    CM->>WS: Send current RoomState.code
    WS-->>FE: Initial Code

    %% Collaboration
    U->>FE: Type Code
    FE->>WS: Send "import os..."
    WS->>CM: broadcast(room_id, code, sender=A)
    CM->>CM: Update RoomState.code
    CM->>U2: Send "import os..."
```

## 4. Entity Relationship Diagram (ERD)
The database schema for persistent data.

```mermaid
erDiagram
    ROOM {
        int id PK
        string room_id UK "Unique UUID/String"
        datetime created_at "Server Default Now"
    }
```
