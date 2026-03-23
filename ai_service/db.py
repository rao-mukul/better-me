from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URI

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db():
    """Return the Atlas database handle.

    The database name is taken from the path component of MONGODB_URI
    (e.g. mongodb+srv://user:pass@cluster/<dbname>?...).
    Falls back to 'health_tracker' if the URI has no explicit database.
    """
    client = get_client()
    try:
        db = client.get_default_database()
    except Exception:
        db = client["health_tracker"]
    return db
