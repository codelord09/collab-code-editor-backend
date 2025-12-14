# System Architecture & Technical Roadmap

This document outlines the architectural vision for evolving the Collaborative Code Editor into a production-grade platform.

## 1. Database Schema Design
The database handles metadata, authentication, and persistence of code state. It allows for complex relationship management between users, rooms, and files.

```mermaid
erDiagram
    USERS {
        int id PK
        string username
        string email
        string password_hash
        datetime created_at
    }
    
    ROOMS {
        int id PK
        string room_id UK
        int owner_id FK
        boolean is_private
        datetime created_at
    }
    
    ROOM_PARTICIPANTS {
        int room_id FK
        int user_id FK
        string role "ENUM: owner, editor, viewer"
        datetime joined_at
    }
    
    FILES {
        int id PK
        int room_id FK
        string name
        string language
        text content
        int version_vector
    }

    USERS ||--o{ ROOMS : "creates"
    USERS ||--o{ ROOM_PARTICIPANTS : "joins"
    ROOMS ||--|{ ROOM_PARTICIPANTS : "has"
    ROOMS ||--|{ FILES : "contains"
```

### Technical Rationale
*   **Normalized Relationship Model**: The use of a junction table (`ROOM_PARTICIPANTS`) decouples Users from Rooms, enabling a flexible Many-to-Many relationship. This supports scenarios where a single user contributes to multiple coding sessions simultaneously.
*   **Role-Based Access Control (RBAC)**: Storing explicit `roles` within the participation link allows the API layer to enforce granular permissions (e.g., Viewers can subscribe to WebSockets but cannot emit 'edit' events).

---

## 2. Distributed Real-Time Architecture
To support thousands of concurrent sessions, the system decouples connection state from application logic using a Pub/Sub model.

```mermaid
graph TD
    Client[Client Frontend]
    LB[Load Balancer]
    
    subgraph "Stateful Layer"
        API1[API Node 1]
        API2[API Node 2]
    end
    
    subgraph "Stateless Layer"
        Redis[(Redis Pub/Sub)]
        DB[(PostgreSQL)]
    end
    
    Client -- "WebSocket (Sticky Session)" --> LB
    LB --> API1
    
    API1 -- "Publish: room-updates" --> Redis
    Redis -- "Broadcast" --> API2
    
    API1 -- "Async Write" --> DB
```

### Architectural Decisions
*   **WebSocket Protocol**: Provides the necessary full-duplex communication channel for low-latency (<50ms) updates, far superior to HTTP polling for this use case.
*   **Horizontal Scalability**: WebSocket connections are stateful. By introducing Redis Pub/Sub, we essentially make the nodes "stateless" regarding data distribution—any node can broadcast an update to any other node.
*   **Ephemeral vs. Persistent State**: High-frequency data (cursor movements, active selections) is routed exclusively through Redis to reduce database I/O pressure. Only document content is flushed to PostgreSQL.

---

## 3. Collaborative Consistency Model
Handling concurrent edits requires robust conflict resolution strategies to ensure all users see the same document state.

```mermaid
sequenceDiagram
    participant UserA
    participant Server
    participant UserB
    
    UserA->>Server: Op(insert='a', pos=10) @ v5
    
    opt Conflict Detection
        Server->>Server: Check Current Version
    end
    
    alt Version == v5
        Server->>Server: Apply & Increment (v6)
        Server->>UserB: Broadcast(insert='a', pos=10) @ v6
        Server-->>UserA: Acknowledge(v6)
    else Version > v5 (Conflict)
        Server->>Server: Transform Operation (OT)
        Server->>UserB: Broadcast(transformed_op)
        Server-->>UserA: Send Remediation
    end
```

### Concurrency Strategy
*   **Operational Transformation (OT)**: Standard mechanism used by Google Docs/Etherpad. It mathematically transforms operations based on concurrent changes, ensuring eventual consistency without discarding user input.
*   **Causality Tracking**: By versioning every operation vector, the server acts as the central source of truth, ordering events linearly to resolve race conditions.
