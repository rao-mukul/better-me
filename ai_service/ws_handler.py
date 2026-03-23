"""WebSocket relay handler: browser ↔ AI_Service ↔ Gemini Live."""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types
from google.genai.errors import APIError

from config import GEMINI_API_KEY
from gemini_session import (
    SessionState,
    build_system_prompt,
    reset_tool_call_count,
    should_warn_turn_limit,
    truncate_history,
)
from tool_handlers import (
    get_clean_timers,
    get_diet_logs,
    get_gym_logs,
    get_sleep_logs,
    get_water_logs,
)
from tools_schema import TOOL_DEFINITIONS

logger = logging.getLogger(__name__)

router = APIRouter()

_TOOL_HANDLERS = {
    "get_sleep_logs": get_sleep_logs,
    "get_water_logs": get_water_logs,
    "get_gym_logs": get_gym_logs,
    "get_diet_logs": get_diet_logs,
    "get_clean_timers": get_clean_timers,
}


# ---------------------------------------------------------------------------
# browser → Gemini task
# ---------------------------------------------------------------------------

async def browser_to_gemini(
    ws: WebSocket,
    state: SessionState,
    stop_event: asyncio.Event,
) -> None:
    """Forward browser messages to the Gemini Live session."""
    try:
        while not stop_event.is_set():
            try:
                message = await asyncio.wait_for(ws.receive(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send a keepalive ping — if the WS is dead this will raise
                logger.debug("browser_to_gemini: keepalive tick")
                continue

            # Disconnected
            if message.get("type") == "websocket.disconnect":
                logger.info("browser_to_gemini: browser disconnected")
                break

            # Binary frame — raw PCM audio (Int16, 16 kHz)
            raw_bytes = message.get("bytes")
            if raw_bytes is not None:
                logger.debug("browser_to_gemini: audio chunk %d bytes", len(raw_bytes))
                await state.gemini_session.send_realtime_input(
                    audio=types.Blob(data=raw_bytes, mime_type="audio/pcm;rate=16000")
                )
                continue

            # Text frame — JSON control message
            raw_text = message.get("text")
            if raw_text is None:
                continue

            try:
                msg = json.loads(raw_text)
            except json.JSONDecodeError:
                logger.warning("browser_to_gemini: non-JSON frame: %s", raw_text[:200])
                continue

            msg_type = msg.get("type")
            logger.debug("browser_to_gemini: received msg type=%s", msg_type)

            if msg_type == "text_input":
                text = msg.get("text", "").strip()
                if not text:
                    continue
                logger.info("browser_to_gemini: text_input: %r", text[:80])
                # Use send_client_content for text — ordered, deterministic
                await state.gemini_session.send_client_content(
                    turns=types.Content(
                        role="user",
                        parts=[types.Part(text=text)],
                    ),
                    turn_complete=True,
                )
                state.conversation_history.append({"role": "user", "text": text})
                state.turn_count += 1
                truncate_history(state)
                if should_warn_turn_limit(state):
                    await ws.send_text(
                        json.dumps(
                            {"type": "turn_limit_warning", "turn_count": state.turn_count}
                        )
                    )

            elif msg_type == "session_end":
                logger.info("browser_to_gemini: session_end received")
                break

            elif msg_type == "mute_audio":
                pass  # informational only

            else:
                logger.debug("browser_to_gemini: ignoring unknown type=%s", msg_type)

    except WebSocketDisconnect:
        logger.info("browser_to_gemini: WebSocketDisconnect")
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        logger.exception("browser_to_gemini: unexpected error: %s", exc)
    finally:
        stop_event.set()
        logger.debug("browser_to_gemini: exiting")


# ---------------------------------------------------------------------------
# Gemini → browser task
# ---------------------------------------------------------------------------

async def gemini_to_browser(
    ws: WebSocket,
    state: SessionState,
    stop_event: asyncio.Event,
) -> None:
    """Stream Gemini Live responses back to the browser.

    Uses _receive() directly (not receive()) so we get every individual
    message — including mid-turn audio chunks — without waiting for
    turn_complete.
    """
    try:
        while not stop_event.is_set():
            try:
                # _receive() gives us each raw server message immediately
                response = await asyncio.wait_for(
                    state.gemini_session._receive(), timeout=60.0
                )
            except asyncio.TimeoutError:
                logger.debug("gemini_to_browser: receive timeout, continuing")
                continue
            except APIError as exc:
                logger.error("gemini_to_browser: Gemini API error: %s", exc)
                await _safe_send(ws, json.dumps({
                    "type": "error",
                    "message": f"Gemini error: {exc}",
                    "code": "GEMINI_ERROR",
                }))
                break
            except Exception as exc:
                logger.exception("gemini_to_browser: receive error: %s", exc)
                break

            sc = response.server_content

            if sc is not None:
                # ── Audio output chunks ──────────────────────────────────
                if sc.model_turn and sc.model_turn.parts:
                    for part in sc.model_turn.parts:
                        if part.inline_data and part.inline_data.data:
                            logger.debug(
                                "gemini_to_browser: audio chunk %d bytes",
                                len(part.inline_data.data),
                            )
                            await ws.send_bytes(part.inline_data.data)

                # ── Output transcription (text of what Gemini said) ──────
                if sc.output_transcription and sc.output_transcription.text:
                    text = sc.output_transcription.text
                    logger.debug("gemini_to_browser: text_delta %r", text[:60])
                    await _safe_send(ws, json.dumps({
                        "type": "text_delta",
                        "text": text,
                        "turn_id": str(state.turn_count),
                    }))

                # ── Turn complete ────────────────────────────────────────
                if sc.turn_complete:
                    logger.info("gemini_to_browser: turn_complete, turn=%d", state.turn_count)
                    await _safe_send(ws, json.dumps({
                        "type": "text_done",
                        "turn_id": str(state.turn_count),
                    }))
                    reset_tool_call_count(state)

                # ── Barge-in / interruption ──────────────────────────────
                if sc.interrupted:
                    logger.info("gemini_to_browser: interrupted")
                    await _safe_send(ws, json.dumps({"type": "interrupted"}))
                    reset_tool_call_count(state)

            # ── Tool calls ───────────────────────────────────────────────
            if response.tool_call:
                for fc in response.tool_call.function_calls:
                    await _handle_tool_call(ws, state, fc)

    except asyncio.CancelledError:
        pass
    except Exception as exc:
        logger.exception("gemini_to_browser: unexpected error: %s", exc)
    finally:
        stop_event.set()
        logger.debug("gemini_to_browser: exiting")


async def _handle_tool_call(ws: WebSocket, state: SessionState, fc) -> None:
    """Execute a single Gemini tool call and send the response back."""
    if state.tool_call_count >= 5:
        logger.warning("tool call limit reached, skipping: %s", fc.name)
        await state.gemini_session.send_tool_response(
            function_responses=types.FunctionResponse(
                id=fc.id,
                name=fc.name,
                response={"error": "Tool call limit exceeded (max 5 per turn)"},
            )
        )
        return

    logger.info("tool_call: %s args=%s", fc.name, dict(fc.args) if fc.args else {})
    await _safe_send(ws, json.dumps({"type": "tool_call_start", "tool": fc.name}))

    handler = _TOOL_HANDLERS.get(fc.name)
    if handler is None:
        logger.error("unknown tool: %s", fc.name)
        result = {"error": f"Unknown tool: {fc.name}"}
    else:
        try:
            args = dict(fc.args) if fc.args else {}
            result = await handler(**args)
            logger.info("tool_call %s returned %d records", fc.name, len(result) if isinstance(result, list) else 1)
        except Exception as exc:
            logger.exception("tool handler %s raised: %s", fc.name, exc)
            result = {"error": str(exc)}

    state.tool_call_count += 1

    await state.gemini_session.send_tool_response(
        function_responses=types.FunctionResponse(
            id=fc.id,
            name=fc.name,
            response={"result": result},
        )
    )


async def _safe_send(ws: WebSocket, text: str) -> None:
    """Send a text frame, swallowing errors if the socket is already closed."""
    try:
        await ws.send_text(text)
    except Exception as exc:
        logger.debug("_safe_send: could not send (socket closed?): %s", exc)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@router.websocket("/ws/ai")
async def ws_ai(ws: WebSocket) -> None:
    """WebSocket endpoint: relay audio and control messages between browser and Gemini Live."""
    await ws.accept()
    logger.info("ws_ai: connection accepted from %s", ws.client)

    # Wait for session_start
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
        msg = json.loads(raw)
        if msg.get("type") != "session_start":
            await ws.send_text(json.dumps({
                "type": "error",
                "message": "Expected session_start as first message",
                "code": "BAD_INIT",
            }))
            await ws.close()
            return
    except asyncio.TimeoutError:
        logger.warning("ws_ai: timed out waiting for session_start")
        await ws.close()
        return
    except Exception as exc:
        logger.exception("ws_ai: error waiting for session_start: %s", exc)
        await ws.close()
        return

    logger.info("ws_ai: session_start received, connecting to Gemini")

    client = genai.Client(api_key=GEMINI_API_KEY)
    stop_event = asyncio.Event()
    b2g_task = None
    g2b_task = None

    try:
        async with client.aio.live.connect(
            model="gemini-2.5-flash-native-audio-preview-12-2025",
            config=types.LiveConnectConfig(
                system_instruction=build_system_prompt(),
                tools=TOOL_DEFINITIONS,
                response_modalities=["AUDIO"],
                output_audio_transcription=types.AudioTranscriptionConfig(),
            ),
        ) as gemini_session:
            logger.info("ws_ai: Gemini session established")
            state = SessionState(gemini_session=gemini_session)
            await ws.send_text(json.dumps({"type": "session_ready"}))

            b2g_task = asyncio.create_task(
                browser_to_gemini(ws, state, stop_event),
                name="browser_to_gemini",
            )
            g2b_task = asyncio.create_task(
                gemini_to_browser(ws, state, stop_event),
                name="gemini_to_browser",
            )

            # Wait until either task signals done
            await stop_event.wait()
            logger.info("ws_ai: stop_event set, shutting down tasks")

    except WebSocketDisconnect:
        logger.info("ws_ai: WebSocket disconnected during session setup")
    except APIError as exc:
        logger.error("ws_ai: Gemini API error during connect: %s", exc)
        await _safe_send(ws, json.dumps({
            "type": "error",
            "message": str(exc),
            "code": "GEMINI_CONNECT_ERROR",
        }))
    except Exception as exc:
        logger.exception("ws_ai: session error: %s", exc)
        await _safe_send(ws, json.dumps({
            "type": "error",
            "message": str(exc),
            "code": "SESSION_ERROR",
        }))
    finally:
        stop_event.set()
        for task in (b2g_task, g2b_task):
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except (asyncio.CancelledError, Exception):
                    pass
        logger.info("ws_ai: connection closed")
