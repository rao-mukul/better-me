import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ---------------------------------------------------------------------------
// State shape & reducer
// ---------------------------------------------------------------------------

const initialState = {
  status: "idle",          // "idle" | "connecting" | "active" | "reconnecting" | "error"
  turns: [],               // { id, role, text, timestamp, isPartial? }[]
  isMuted: false,
  turnCount: 0,
  turnLimitWarning: false,
  isToolCallActive: false,
};

function sessionReducer(state, action) {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status };

    case "SET_MUTED":
      return { ...state, isMuted: action.isMuted };

    case "SET_TURN_LIMIT_WARNING":
      return { ...state, turnLimitWarning: action.value };

    case "APPEND_TURN":
      return { ...state, turns: [...state.turns, action.turn] };

    case "UPSERT_ASSISTANT_TURN": {
      // Find existing partial turn with matching turn_id, or append a new one
      const idx = state.turns.findIndex(
        (t) => t.id === action.turn_id && t.role === "assistant"
      );
      if (idx === -1) {
        return {
          ...state,
          turns: [
            ...state.turns,
            {
              id: action.turn_id,
              role: "assistant",
              text: action.text,
              timestamp: Date.now(),
              isPartial: true,
            },
          ],
        };
      }
      const updated = state.turns.map((t, i) =>
        i === idx ? { ...t, text: t.text + action.text, isPartial: true } : t
      );
      return { ...state, turns: updated };
    }

    case "FINALIZE_ASSISTANT_TURN": {
      const updated = state.turns.map((t) =>
        t.id === action.turn_id && t.role === "assistant"
          ? { ...t, isPartial: false }
          : t
      );
      return { ...state, turns: updated, turnCount: state.turnCount + 1 };
    }

    case "APPEND_ERROR_TURN":
      return {
        ...state,
        turns: [
          ...state.turns,
          {
            id: crypto.randomUUID(),
            role: "error",
            text: action.message,
            timestamp: Date.now(),
          },
        ],
      };

    case "SET_TOOL_CALL_ACTIVE":
      return { ...state, isToolCallActive: action.value };

    case "RESET":
      return {
        ...initialState,
        // preserve turns if reconnecting so history is not lost
        turns: action.preserveTurns ? state.turns : [],
      };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAssistantSession
 *
 * Manages the WebSocket connection to the AI service, session lifecycle,
 * conversation turns, and mute state.
 *
 * @param {{ enqueueChunk: (buf: ArrayBuffer) => void, interrupt: () => void }} audioPlayback
 */
export function useAssistantSession(audioPlayback) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const audioPlaybackRef = useRef(audioPlayback);
  const statusRef = useRef("idle"); // mirror of state.status for use inside callbacks

  // Keep audioPlaybackRef and statusRef in sync
  useEffect(() => {
    audioPlaybackRef.current = audioPlayback;
  }, [audioPlayback]);

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // ---------------------------------------------------------------------------
  // startSession
  // ---------------------------------------------------------------------------
  const startSession = useCallback(() => {
    dispatch({ type: "SET_STATUS", status: "connecting" });

    const url = (import.meta.env.VITE_AI_SERVICE_URL ?? "") + "/ws/ai";
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "session_start" }));
    };

    ws.onmessage = async (event) => {
      // Binary frame → audio chunk
      if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
        const buffer =
          event.data instanceof Blob
            ? await event.data.arrayBuffer()
            : event.data;
        audioPlaybackRef.current?.enqueueChunk(buffer);
        return;
      }

      // JSON control message
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.warn("[useAssistantSession] Non-JSON text frame:", event.data);
        return;
      }

      switch (msg.type) {
        case "session_ready":
          dispatch({ type: "SET_STATUS", status: "active" });
          reconnectAttemptsRef.current = 0;
          break;

        case "text_delta":
          dispatch({
            type: "UPSERT_ASSISTANT_TURN",
            turn_id: msg.turn_id,
            text: msg.text ?? "",
          });
          break;

        case "text_done":
          dispatch({ type: "FINALIZE_ASSISTANT_TURN", turn_id: msg.turn_id });
          dispatch({ type: "SET_TOOL_CALL_ACTIVE", value: false });
          break;

        case "tool_call_start":
          dispatch({ type: "SET_TOOL_CALL_ACTIVE", value: true });
          break;

        case "interrupted":
          audioPlaybackRef.current?.interrupt();
          break;

        case "error":
          dispatch({ type: "APPEND_ERROR_TURN", message: msg.message ?? "Unknown error" });
          break;

        case "turn_limit_warning":
          dispatch({ type: "SET_TURN_LIMIT_WARNING", value: true });
          break;

        default:
          // Unknown message types are silently ignored
          break;
      }
    };

    ws.onclose = (event) => {
      const wasActive = statusRef.current === "active" || statusRef.current === "reconnecting";
      const unexpected = event.code !== 1000;

      if (wasActive && unexpected) {
        // Attempt reconnect
        if (reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current += 1;
          dispatch({ type: "SET_STATUS", status: "reconnecting" });
          setTimeout(() => {
            // Preserve turns across reconnect
            startSession();
          }, 2000);
        } else {
          dispatch({ type: "SET_STATUS", status: "error" });
        }
      }
    };

    ws.onerror = (err) => {
      console.error("[useAssistantSession] WebSocket error:", err);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // endSession
  // ---------------------------------------------------------------------------
  const endSession = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "session_end" }));
      ws.close(1000);
    }
    wsRef.current = null;
    reconnectAttemptsRef.current = 0;
    dispatch({ type: "RESET", preserveTurns: false });
  }, []);

  // ---------------------------------------------------------------------------
  // sendText
  // ---------------------------------------------------------------------------
  const sendText = useCallback((text) => {
    dispatch({
      type: "APPEND_TURN",
      turn: {
        id: crypto.randomUUID(),
        role: "user",
        text,
        timestamp: Date.now(),
      },
    });

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "text_input", text }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // sendAudioChunk
  // ---------------------------------------------------------------------------
  const sendAudioChunk = useCallback((buffer) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(buffer);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // toggleMute
  // ---------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    const newMuted = !state.isMuted;
    dispatch({ type: "SET_MUTED", isMuted: newMuted });

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "mute_audio", muted: newMuted }));
    }
  }, [state.isMuted]);

  // ---------------------------------------------------------------------------
  // Mount / unmount lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleBeforeUnload = () => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    status: state.status,
    turns: state.turns,
    isMuted: state.isMuted,
    turnCount: state.turnCount,
    turnLimitWarning: state.turnLimitWarning,
    isToolCallActive: state.isToolCallActive,
    startSession,
    endSession,
    sendText,
    sendAudioChunk,
    toggleMute,
  };
}
