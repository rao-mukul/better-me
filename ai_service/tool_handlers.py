from bson import ObjectId
from datetime import datetime

from config import DEFAULT_USER_ID
from db import get_db


def _serialize(doc: dict) -> dict:
    """Convert ObjectId and datetime values to strings for JSON serialization."""
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


async def get_sleep_logs(start_date: str, end_date: str) -> list:
    """Fetch complete sleep log entries for a date range.

    Queries the sleeplogs collection filtering isComplete: True and the
    given date range. Returns up to 30 documents.
    """
    db = get_db()
    cursor = db["sleeplogs"].find(
        {
            "userId": DEFAULT_USER_ID,
            "date": {"$gte": start_date, "$lte": end_date},
            "isComplete": True,
        },
        projection={
            "_id": 0,
            "date": 1,
            "duration": 1,
            "quality": 1,
            "sleptAt": 1,
            "wokeUpAt": 1,
            "isComplete": 1,
        },
    ).limit(30)

    return [_serialize(doc) async for doc in cursor]


async def get_water_logs(start_date: str, end_date: str) -> list:
    """Fetch daily water intake stats for a date range.

    Queries the dailystats collection. Returns up to 30 documents.
    """
    db = get_db()
    cursor = db["dailystats"].find(
        {
            "userId": DEFAULT_USER_ID,
            "date": {"$gte": start_date, "$lte": end_date},
        },
        projection={
            "_id": 0,
            "date": 1,
            "totalMl": 1,
            "goal": 1,
            "goalMet": 1,
            "entryCount": 1,
        },
    ).limit(30)

    return [_serialize(doc) async for doc in cursor]


async def get_gym_logs(start_date: str, end_date: str) -> list:
    """Fetch gym workout logs for a date range.

    Queries the gymlogs collection. Returns up to 30 documents.
    """
    db = get_db()
    cursor = db["gymlogs"].find(
        {
            "userId": DEFAULT_USER_ID,
            "date": {"$gte": start_date, "$lte": end_date},
        },
        projection={
            "_id": 0,
            "date": 1,
            "workoutType": 1,
            "primaryMuscle": 1,
            "secondaryMuscle": 1,
            "primaryExercises": 1,
            "secondaryExercises": 1,
            "duration": 1,
        },
    ).limit(30)

    return [_serialize(doc) async for doc in cursor]


async def get_diet_logs(
    start_date: str, end_date: str, food_filter: str = ""
) -> list:
    """Fetch diet/meal log entries for a date range with optional food name filter.

    Queries the dietlogs collection. When food_filter is provided, applies a
    case-insensitive regex match on the foodName field. Returns up to 30 documents.
    """
    db = get_db()
    query: dict = {
        "userId": DEFAULT_USER_ID,
        "date": {"$gte": start_date, "$lte": end_date},
    }
    if food_filter:
        query["foodName"] = {"$regex": food_filter, "$options": "i"}

    cursor = db["dietlogs"].find(
        query,
        projection={
            "_id": 0,
            "date": 1,
            "foodName": 1,
            "calories": 1,
            "protein": 1,
            "carbs": 1,
            "fat": 1,
            "fiber": 1,
            "eatenAt": 1,
        },
    ).limit(30)

    return [_serialize(doc) async for doc in cursor]


async def get_clean_timers() -> list:
    """Fetch all active clean timer records.

    Queries the cleantimers collection for isActive: True. Computes
    resetCount (length of resetHistory) and lastResetAt (most recent
    resetHistory entry date, or None). Returns up to 30 documents.
    """
    db = get_db()
    cursor = db["cleantimers"].find(
        {
            "userId": DEFAULT_USER_ID,
            "isActive": True,
        },
        projection={
            "_id": 0,
            "habitName": 1,
            "startedAt": 1,
            "isActive": 1,
            "category": 1,
            "resetHistory": 1,
        },
    ).limit(30)

    results = []
    async for doc in cursor:
        reset_history = doc.pop("resetHistory", [])
        reset_count = len(reset_history)
        last_reset_at = None
        if reset_history:
            # Most recent entry is the last element (appended in order)
            last_entry = max(reset_history, key=lambda e: e.get("resetAt", datetime.min))
            raw = last_entry.get("resetAt")
            if isinstance(raw, datetime):
                last_reset_at = raw.isoformat()
            elif raw is not None:
                last_reset_at = str(raw)

        serialized = _serialize(doc)
        serialized["resetCount"] = reset_count
        serialized["lastResetAt"] = last_reset_at
        results.append(serialized)

    return results
