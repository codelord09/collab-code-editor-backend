from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time

from db.database import engine, Base
from routers import rooms, websocket
from utils.logger import logger

app = FastAPI(title="Collaborative Code Editor Backend")

# CORS middleware for frontend access
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
    "*"
]

# CORS middleware is used to allow web browsers to make requests to this backend
# from different origins (domains, protocols, or ports) than the backend itself.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log all requests and responses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log details of all incoming HTTP requests and their responses.
    Logs method, path, status code, and processing duration.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {process_time:.4f}s")
    return response

# Startup event to create tables if they don't exist
# In production, use Alembic migrations instead
@app.on_event("startup")
async def startup():
    """
    Event handler that runs on application startup.
    Initializes the database by creating all tables defined in models.
    """
    logger.info("Starting up application...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")

@app.on_event("shutdown")
async def shutdown():
    """
    Event handler that runs on application shutdown.
    Logs the shutdown event.
    """
    logger.info("Shutting down application...")

app.include_router(rooms.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    """
    Root endpoint to verify that the backend is running.
    Returns a welcome message.
    """
    logger.info("Root endpoint called")
    return {"message": "Collaborative Editor Backend Running"}
