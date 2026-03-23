# Implementation Plan: Realtime AI Assistant

## Overview

Implement a Python FastAPI AI_Service that relays audio and text between the React frontend and the Gemini Live API, executes MongoDB tool calls for all 5 health data domains, and a set of React components/hooks for voice capture, PCM playback, and the chat UI.

## Tasks

- [x] 1. Scaffold AI_Service (FastAPI app, config, MongoDB connection)
  - Create `ai_service/` directory with `main.py`, `config.py`, `db.py`, `requirements.txt`
  - `config.py`: load `GEMINI_API_KEY`, `MONGODB_URI`, `CLIENT_ORIGIN`, `DEFAULT_USER_ID` from env
  - `db.py`: async Motor client, expose `get_db()` returning the Atlas database handle
  - `main.py`: FastAPI app with CORSMiddleware using `CLIENT_ORIGIN` and `http://localhost:5173`; include `/health` GET endpoint; register WebSocket router
  - `requirements.txt`: `fastapi`, `uvicorn[standard]`, `google-genai`, `motor`, `python-dotenv`, `hypothesis`, `pytest`, `pytest-asyncio`
  - _Requirements: 15.1, 11.1_

- [x] 2. Implement MongoDB tool call handlers
  - Create `ai_service/tool_handlers.py` with one async function per data domain
  - [x] 2.1 Implement `get_sleep_logs(start_date, end_date)` — query `SleepLog` collection, filter `isComplete: True`, return fields `date`, `duration`, `quality`, `sleptAt`, `wokeUpAt`, `isComplete`, limit 30
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2_
  - [ ]* 2.2 Write property test for `get_sleep_logs` date range filter (Property 4) and result size bound (Property 5)
    - **Property 4: Tool call date range filter is strict**
    - **Property 5: Tool call result size is bounded**
    - **Validates: Requirements 5.4, 11.3**
  - [x] 2.3 Implement `get_water_logs(start_date, end_date)` — query `DailyStats` collection, return fields `date`, `totalMl`, `goal`, `goalMet`, `entryCount`, limit 30
    - _Requirements: 5.2, 5.3, 5.4, 7.1, 7.2_
  - [x] 2.4 Implement `get_gym_logs(start_date, end_date)` — query `GymLog` collection, return fields `date`, `workoutType`, `primaryMuscle`, `secondaryMuscle`, `primaryExercises`, `secondaryExercises`, `duration`, limit 30
    - _Requirements: 5.2, 5.3, 5.4, 8.1, 8.2_
  - [x] 2.5 Implement `get_diet_logs(start_date, end_date, food_filter="")` — query `DietLog` collection with optional case-insensitive `foodName` regex filter, return fields `date`, `foodName`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `eatenAt`, limit 30
    - _Requirements: 5.2, 5.3, 5.4, 9.1, 9.2, 9.4_
  - [ ]* 2.6 Write property test for diet food name filter (Property 10) and diet totals sum (Property 9)
    - **Property 9: Diet totals are the sum of individual entries**
    - **Property 10: Diet food name filter returns only matching entries**
    - **Validates: Requirements 9.3, 9.4**
  - [x] 2.7 Implement `get_clean_timers()` — query `CleanTimer` collection for `isActive: True`, return fields `habitName`, `startedAt`, `isActive`, `category`, `resetCount` (len of resetHistory), `lastResetAt`
    - _Requirements: 5.2, 5.3, 10.1, 10.2_
  - [ ]* 2.8 Write property test for required fields in all tool call responses (Property 7), sleep aggregation excludes incomplete entries (Property 8), and clean timer streak calculation (Property 11)
    - **Property 7: Tool call responses contain all required fields**
    - **Property 8: Sleep aggregation excludes incomplete entries**
    - **Property 11: Clean timer streak calculation is correct**
    - **Validates: Requirements 6.2, 6.3, 6.4, 7.2, 8.2, 9.2, 10.2, 10.3**

- [x] 3. Define Gemini tool schemas and build system prompt
  - Create `ai_service/tools_schema.py` with `TOOL_DEFINITIONS` list — one `Tool` object per handler using the JSON schemas from the design
  - Create `ai_service/gemini_session.py` with `build_system_prompt()` — injects today's date (`yyyy-MM-dd`), instructs model to use tool calls before answering data questions, keep responses under 100 words unless detail requested, answer only health/fitness topics
  - _Requirements: 5.1, 13.1, 13.2, 13.3, 13.4_
  - [ ]* 3.1 Write property test for system prompt content (Property 15)
    - **Property 15: System prompt contains required content including current date**
    - **Validates: Requirements 13.1, 13.2, 13.4**

- [x] 4. Implement Gemini Live session management
  - In `ai_service/gemini_session.py`, implement `create_session()` — calls `client.aio.live.connect()` with model `gemini-2.5-flash-native-audio-preview-12-2025`, `LiveConnectConfig` with system prompt, tool definitions, `response_modalities=["AUDIO","TEXT"]`, input 16kHz, output 24kHz
  - Implement `SessionState` dataclass: `gemini_session`, `turn_count`, `tool_call_count`, `conversation_history` (last 10 turns)
  - Implement history truncation: before each turn, slice `conversation_history` to last 10 entries
  - Implement turn limit warning: emit `turn_limit_warning` when `turn_count >= 20`
  - _Requirements: 11.1, 11.2, 11.4, 14.4_
  - [ ]* 4.1 Write property test for history truncation to last 10 turns (Property 12) and turn limit warning threshold (Property 13)
    - **Property 12: Conversation history sent to Gemini is truncated to last 10 turns**
    - **Property 13: Turn limit warning fires at threshold**
    - **Validates: Requirements 11.2, 11.4**

- [x] 5. Implement WebSocket relay handler
  - Create `ai_service/ws_handler.py` with FastAPI `WebSocket` endpoint at `/ws/ai`
  - On connect: instantiate `SessionState`; wait for `session_start` JSON message before creating Gemini session; send `session_ready` on success
  - Run two concurrent `asyncio.Task`s per connection: `browser_to_gemini` and `gemini_to_browser`
  - `browser_to_gemini`: binary frames → `session.send_realtime_input(audio=chunk)`; JSON `text_input` → `session.send_realtime_input(text=...)`; JSON `session_end` → close session
  - `gemini_to_browser`: audio output chunks → binary frames to browser; `text_delta` → JSON `{type:"text_delta",...}`; `text_done` → JSON `{type:"text_done",...}`; interrupted signal → JSON `{type:"interrupted"}`; tool call events → execute handler, enforce 5-call limit, send `tool_call_start` JSON, return result via `session.send_tool_response()`
  - On WebSocket disconnect: cancel both tasks, close Gemini session, release resources
  - _Requirements: 2.2, 3.1, 4.1, 4.2, 4.3, 5.2, 5.6, 14.1, 15.2, 15.6_
  - [ ]* 5.1 Write property test for tool call count per turn bounded at 5 (Property 6)
    - **Property 6: Tool call invocation count per turn is bounded**
    - **Validates: Requirements 5.6**

- [x] 6. Checkpoint — AI_Service unit tests
  - Write `ai_service/tests/test_unit.py` with pytest unit tests:
    - Tool handler returns `[]` when no MongoDB documents match
    - System prompt includes today's date (snapshot)
    - `session_start` triggers Gemini session creation (mock `google-genai`)
    - `session_end` closes Gemini session and releases resources (mock)
    - `get_diet_logs` with `food_filter=""` returns all entries
    - `get_sleep_logs` with all `isComplete: False` entries returns empty list
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 5.5, 6.4, 13.4_

- [x] 7. Implement AudioWorklet PCM capture
  - Create `client/src/components/assistant/pcm-processor.js` — `AudioWorkletProcessor` subclass named `"pcm-processor"`: converts float32 mic samples to Int16 (multiply by 32767, clamp to [-32768, 32767]), posts `Int16Array` buffer via `port.postMessage`
  - Create `client/src/components/assistant/useAudioCapture.js` — hook: requests mic permission, creates `AudioContext` at 16kHz, registers and connects `pcm-processor` worklet, exposes `startCapture()`, `stopCapture()`, `isCapturing`, `permissionError`; on each worklet message, calls `onChunk(int16ArrayBuffer)` callback
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 8. Implement PCM playback queue
  - Create `client/src/components/assistant/useAudioPlayback.js` — hook: maintains `AudioContext` at 24kHz and `nextStartTime` ref; `enqueueChunk(arrayBuffer)`: decodes Int16 PCM to `AudioBuffer`, schedules `AudioBufferSourceNode` at `nextStartTime`, advances `nextStartTime`; `interrupt()`: cancels all scheduled nodes, resets `nextStartTime` to `audioCtx.currentTime`; respects `isMuted` — silently discards chunks when muted; exposes `isSpeaking` (true while queue is non-empty)
  - _Requirements: 3.1, 3.2, 3.4, 4.3_
  - [ ]* 8.1 Write property test for PCM playback queue chunk order (Property 20) and mute suppression (Property 19)
    - **Property 20: PCM playback queue preserves chunk order**
    - **Property 19: Mute state suppresses audio playback**
    - **Validates: Requirements 3.2, 3.4**

- [x] 9. Implement WebSocket client hook
  - Create `client/src/components/assistant/useAssistantSession.js` — hook managing full session lifecycle:
    - State: `status` (`"idle"|"connecting"|"active"|"reconnecting"|"error"`), `turns`, `isMuted`, `isListening`, `isSpeaking`, `reconnectAttempts`, `turnCount`
    - `startSession()`: open `WebSocket` to `VITE_AI_SERVICE_URL/ws/ai`, send `{type:"session_start"}` on open, set status `"active"` on `session_ready`
    - `endSession()`: send `{type:"session_end"}`, close WebSocket, reset state
    - On binary message: call `audioPlayback.enqueueChunk()`
    - On JSON `text_delta`: append/update current assistant turn in `turns`
    - On JSON `text_done`: finalize current assistant turn, increment `turnCount`
    - On JSON `interrupted`: call `audioPlayback.interrupt()`, set `isSpeaking=false`
    - On JSON `error`: append error turn, keep UI mounted
    - On JSON `turn_limit_warning`: set warning flag
    - On unexpected close: auto-reconnect up to 3 times with 2s delay; on 3rd failure set status `"error"`; preserve `turns` across reconnect
    - `sendText(text)`: send `{type:"text_input", text}`, append user turn
    - `sendAudioChunk(buffer)`: send binary frame
    - `toggleMute()`: toggle `isMuted`, send `{type:"mute_audio", muted}`
    - On browser unload (`beforeunload`): send close frame
    - _Requirements: 1.2, 1.4, 1.5, 3.4, 3.5, 4.3, 11.4, 12.1, 12.2, 12.3, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  - [ ]* 9.1 Write property test for conversation history grows monotonically (Property 2), error messages non-empty and UI stays mounted (Property 3), reconnect attempts bounded at 3 (Property 17), session context preserved across reconnect (Property 18), new session clears history (Property 14), interruption clears playback queue (Property 16)
    - **Property 2: Conversation history grows monotonically**
    - **Property 3: Error messages are always user-readable strings**
    - **Property 14: New session clears previous history**
    - **Property 16: Interruption signal stops audio playback queue**
    - **Property 17: Reconnect attempts are bounded at 3**
    - **Property 18: Session context is preserved across successful reconnection**
    - **Validates: Requirements 1.3, 1.4, 1.5, 4.3, 12.2, 15.3, 15.5**

- [x] 10. Implement AssistantUI components
  - [x] 10.1 Create `client/src/components/assistant/ChatHistory.jsx` — renders scrollable list of `Turn` objects; auto-scrolls to bottom when `turns` array changes; renders user turns right-aligned, assistant turns left-aligned; shows partial text for in-progress assistant turn
    - _Requirements: 1.1, 1.3, 14.5_
  - [x] 10.2 Create `client/src/components/assistant/ChatInput.jsx` — text input + send button; disabled when `status !== "active"`; on submit calls `session.sendText(text)` and clears input
    - _Requirements: 1.1, 1.2_
  - [x] 10.3 Create `client/src/components/assistant/VoiceControls.jsx` — mic toggle button (calls `startCapture`/`stopCapture`, shows animated mic icon while `isListening`); mute/unmute toggle (visible during active session); speaking indicator (animated waveform while `isSpeaking`); disables mic button if `permissionError` or AudioWorklet unsupported; shows fallback message when AudioWorklet not supported
    - _Requirements: 2.3, 2.4, 2.5, 3.3, 3.5_
  - [x] 10.4 Create `client/src/components/assistant/AssistantUI.jsx` — root component: composes `ChatHistory`, `ChatInput`, `VoiceControls`; "Start Session" button when `status === "idle"`; "End Session" button when active; active indicator while `status === "active"`; reconnecting indicator + disabled input while `status === "reconnecting"`; error message display when `status === "error"`; turn limit warning banner when `turnCount >= 20`; wires `useAssistantSession`, `useAudioCapture`, `useAudioPlayback` together; registers `beforeunload` handler to end session on tab close
    - _Requirements: 1.1, 1.4, 2.3, 3.3, 3.5, 11.4, 12.1, 12.3, 12.4, 12.5, 15.3, 15.4_

- [x] 11. Checkpoint — Frontend unit tests
  - Install `fast-check` dev dependency: `npm install --save-dev fast-check` in `client/`
  - Write `client/src/components/assistant/__tests__/AssistantUI.test.jsx` with vitest unit tests:
    - `AssistantUI` renders start session button when `status === "idle"`
    - `AssistantUI` renders active indicator when `status === "active"`
    - `AssistantUI` renders reconnecting indicator when `status === "reconnecting"`
    - `VoiceControls` disables mic button when AudioWorklet is not supported
    - `VoiceControls` shows mute toggle during active session
    - `ChatHistory` scrolls to bottom when new turn is appended
    - `useAssistantSession` displays partial text on mid-stream disconnect
  - Write `client/src/components/assistant/__tests__/session.property.test.js` with fast-check property tests for Properties 1, 2, 3, 13, 14, 16, 17, 18, 19, 20
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.4, 2.3, 2.4, 3.3, 3.4, 4.3, 11.4, 14.5, 15.3, 15.5_

- [-] 12. Add AssistantUI to app routing
  - Create `client/src/pages/AssistantPage.jsx` — renders `<AssistantUI />` with page-level layout
  - Add route `/assistant` in `client/src/App.jsx` pointing to `AssistantPage`
  - Add navigation link to assistant in the existing layout component
  - _Requirements: 12.1_

- [~] 13. Deployment configuration
  - Create `ai_service/render.yaml` with service definition: `type: web`, `runtime: python`, `buildCommand: pip install -r requirements.txt`, `startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT`, env vars `GEMINI_API_KEY`, `MONGODB_URI`, `CLIENT_ORIGIN` (all `sync: false`)
  - Create `ai_service/.env.example` with all required env var keys and placeholder values
  - Add `VITE_AI_SERVICE_URL` to `client/.env.example`
  - _Requirements: 11.1_

- [~] 14. Final checkpoint — Ensure all tests pass
  - Run `pytest ai_service/tests/` and verify all Python unit and property tests pass
  - Run `npx vitest --run` in `client/` and verify all JS unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests reference design document property numbers for traceability
- `DEFAULT_USER_ID` is hardcoded in AI_Service config — no auth layer needed
- The existing Express backend on Vercel is completely untouched
- Render free tier cold start (~30s) can reuse the existing `ServerWakeupAnimation` component pattern
- PCM input to Gemini: 16kHz Int16; PCM output from Gemini: 24kHz Int16
