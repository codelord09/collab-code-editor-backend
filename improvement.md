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
