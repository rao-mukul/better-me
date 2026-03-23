"""Gemini Live session management."""

from dataclasses import dataclass, field
from datetime import date
from typing import Any

from google.genai.types import LiveConnectConfig

from tools_schema import TOOL_DEFINITIONS  # noqa: F401 — used in Task 4


@dataclass
class SessionState:
    gemini_session: Any
    turn_count: int = 0
    tool_call_count: int = 0
    conversation_history: list = field(default_factory=list)


def build_system_prompt() -> str:
    """Build the system prompt injected into every Gemini Live session.

    Injects today's date and instructs the model to:
    - Answer only health/fitness questions
    - Use tool calls before answering data questions
    - Keep responses under 100 words unless detail is explicitly requested
    - Politely decline non-health questions
    """
    today = date.today().strftime("%Y-%m-%d")
    return (
        f"You are a personal health data analyst assistant. Today's date is {today}.\n\n"
        "You have access to the user's health data through tool calls. "
        "ALWAYS invoke the appropriate tool call to fetch real data before answering "
        "any question about the user's health records — never guess or fabricate data.\n\n"
        "Keep all responses under 100 words unless the user explicitly asks for more detail.\n\n"
        "Only answer questions related to health, fitness, sleep, hydration, gym workouts, "
        "diet/nutrition, and the user's tracked habits. "
        "If the user asks about anything unrelated to these topics, politely decline and "
        "redirect them to supported health and fitness topics."
    )


async def create_session(client) -> SessionState:
    """Create a new Gemini Live session and return a SessionState."""
    session = await client.aio.live.connect(
        model="gemini-2.5-flash-native-audio-preview-12-2025",
        config=LiveConnectConfig(
            system_instruction=build_system_prompt(),
            tools=TOOL_DEFINITIONS,
            response_modalities=["AUDIO"],
        ),
    )
    return SessionState(gemini_session=session)


def truncate_history(state: SessionState) -> None:
    """Slice conversation_history in-place to the last 10 entries."""
    state.conversation_history = state.conversation_history[-10:]


def should_warn_turn_limit(state: SessionState) -> bool:
    """Return True when turn_count has reached or exceeded 20."""
    return state.turn_count >= 20


def reset_tool_call_count(state: SessionState) -> None:
    """Reset tool_call_count to 0."""
    state.tool_call_count = 0
