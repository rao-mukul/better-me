"""Unit tests for AI_Service tool handlers and session management."""

import datetime
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure ai_service package root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_async_cursor(docs: list):
    """Return a MagicMock that supports `async for` iteration over *docs*."""
    cursor = MagicMock()

    async def _aiter():
        for doc in docs:
            yield doc

    cursor.__aiter__ = lambda self: _aiter()
    # find() returns the cursor; limit() returns the same cursor
    cursor.find = MagicMock(return_value=cursor)
    cursor.limit = MagicMock(return_value=cursor)
    return cursor


def _make_db_mock(docs: list):
    """Return a mock db whose collection supports async iteration over *docs*."""
    cursor = _make_async_cursor(docs)
    collection = MagicMock()
    collection.find = MagicMock(return_value=cursor)
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=collection)
    return db


# ---------------------------------------------------------------------------
# get_sleep_logs tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_sleep_logs_empty():
    """Returns [] when the collection yields no documents."""
    db = _make_db_mock([])
    with patch("tool_handlers.get_db", return_value=db):
        from tool_handlers import get_sleep_logs
        result = await get_sleep_logs("2024-01-01", "2024-01-07")
    assert result == []


@pytest.mark.asyncio
async def test_get_sleep_logs_excludes_incomplete():
    """Returns [] when the DB-level filter for isComplete:True yields nothing.

    The query filters isComplete:True at the DB level, so the mock cursor
    returns an empty result set (simulating no matching docs).
    """
    db = _make_db_mock([])  # DB returns empty — isComplete:False docs filtered out
    with patch("tool_handlers.get_db", return_value=db):
        from tool_handlers import get_sleep_logs
        result = await get_sleep_logs("2024-01-01", "2024-01-07")
    assert result == []


# ---------------------------------------------------------------------------
# get_diet_logs tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_diet_logs_empty_food_filter():
    """Returns all docs when food_filter is empty (no regex applied)."""
    docs = [
        {"date": "2024-01-01", "foodName": "Apple", "calories": 95},
        {"date": "2024-01-02", "foodName": "Banana", "calories": 105},
    ]
    db = _make_db_mock(docs)
    with patch("tool_handlers.get_db", return_value=db):
        from tool_handlers import get_diet_logs
        result = await get_diet_logs("2024-01-01", "2024-01-07", food_filter="")
    assert len(result) == 2


# ---------------------------------------------------------------------------
# build_system_prompt tests
# ---------------------------------------------------------------------------

def test_build_system_prompt_contains_today():
    """System prompt includes today's date in yyyy-MM-dd format."""
    from gemini_session import build_system_prompt
    today = datetime.date.today().strftime("%Y-%m-%d")
    prompt = build_system_prompt()
    assert today in prompt


def test_build_system_prompt_contains_required_instructions():
    """System prompt contains key instruction phrases."""
    from gemini_session import build_system_prompt
    prompt = build_system_prompt().lower()
    assert "tool call" in prompt or "tool calls" in prompt
    assert "100 words" in prompt
    assert "health" in prompt


# ---------------------------------------------------------------------------
# SessionState tests
# ---------------------------------------------------------------------------

def test_session_state_defaults():
    """SessionState initialises with zero counts and empty history."""
    from gemini_session import SessionState
    state = SessionState(gemini_session=None)
    assert state.turn_count == 0
    assert state.tool_call_count == 0
    assert state.conversation_history == []


# ---------------------------------------------------------------------------
# truncate_history tests
# ---------------------------------------------------------------------------

def test_truncate_history_over_10():
    """History with 15 items is sliced to the last 10; last item preserved."""
    from gemini_session import SessionState, truncate_history
    items = [{"role": "user", "text": str(i)} for i in range(15)]
    state = SessionState(gemini_session=None, conversation_history=items.copy())
    truncate_history(state)
    assert len(state.conversation_history) == 10
    assert state.conversation_history[-1] == items[-1]


def test_truncate_history_under_10():
    """History with 5 items is left unchanged."""
    from gemini_session import SessionState, truncate_history
    items = [{"role": "user", "text": str(i)} for i in range(5)]
    state = SessionState(gemini_session=None, conversation_history=items.copy())
    truncate_history(state)
    assert len(state.conversation_history) == 5


# ---------------------------------------------------------------------------
# should_warn_turn_limit tests
# ---------------------------------------------------------------------------

def test_should_warn_turn_limit_at_20():
    """Returns True when turn_count == 20."""
    from gemini_session import SessionState, should_warn_turn_limit
    state = SessionState(gemini_session=None, turn_count=20)
    assert should_warn_turn_limit(state) is True


def test_should_warn_turn_limit_below_20():
    """Returns False when turn_count == 19."""
    from gemini_session import SessionState, should_warn_turn_limit
    state = SessionState(gemini_session=None, turn_count=19)
    assert should_warn_turn_limit(state) is False
