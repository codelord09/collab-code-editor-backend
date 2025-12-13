import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Use environment variable or default to a local sqlite for easier runnability if postgres isn't set up,
# BUT user requested Postgres. We will assume a standard postgres URL.
# Ensure you have a running postgres instance or update this URL.
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Fix Render's postgres:// scheme to postgresql+asyncpg:// for SQLAlchemy
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    print(f"DEBUG: Using DATABASE_URL from environment with host: {DATABASE_URL.split('@')[-1].split('/')[0] if '@' in DATABASE_URL else 'UNKNOWN'}")
else:
    print("DEBUG: DATABASE_URL not found, using default localhost.")
    DATABASE_URL = "postgresql+asyncpg://user:password@localhost/collab_db"

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    """
    Dependency generator for database sessions.
    Yields an async session and ensures it closes after use.
    """
    async with AsyncSessionLocal() as session:
        yield session
