# Requirements Document

## Introduction

A real-time multimodal conversational AI assistant embedded in the personal health/fitness tracking app. The assistant lets the user talk naturally (voice or text) to query and discuss their own health data — sleep, water intake, gym workouts, diet/meals, and clean timers — stored in MongoDB. The assistant supports voice input/output via native audio streaming, natural interruptions mid-speech (barge-in), and responds with context drawn from the user's actual data. The system is designed for single-user personal use and must remain free or near-free to operate.

The AI assistant logic runs on a separate Python FastAPI service (AI_Service) deployed on Render's free tier. The AI_Service acts as a relay/proxy between the React frontend and the Gemini Live API: it maintains a stateful WebSocket connection to Gemini Live API and a corresponding WebSocket connection to the browser. The existing Express backend on Vercel remains completely unchanged and continues to serve all non-AI health data endpoints. The AI_Service connects directly to the same MongoDB Atlas instance as the Express backend.

## Glossary

- **Assistant**: The conversational AI component that processes user queries and returns spoken/text responses.
- **Session**: A single continuous conversation between the user and the Assistant, from activation to dismissal.
- **Turn**: One exchange within a Session — one user utterance and one Assistant response.
- **Utterance**: A single spoken or typed message from the user.
- **Interruption**: The act of the user speaking while the Assistant is still producing audio output (barge-in), causing the Gemini Live API to stop the current response and process the new input natively.
- **Data_Context**: A structured summary of the user's health records fetched from MongoDB and injected into the Assistant's prompt for a given query.
- **Tool_Call**: A structured function invocation the Assistant makes to retrieve specific health data from MongoDB, executed by the AI_Service.
- **Gemini_Live**: The Google Gemini Live API using the `gemini-2.5-flash-native-audio-preview-12-2025` model with native audio, accessed via a stateful WebSocket (WSS) connection from the AI_Service. Free tier: 10 RPM, 250 RPD.
- **Live_API_Session**: The stateful WebSocket connection maintained between the AI_Service and the Gemini Live API for the duration of a user Session.
- **PCM_Audio**: Raw 16-bit PCM audio — the native audio format used by the Gemini Live API. Input is sampled at 16kHz; output is delivered at 24kHz.
- **Health_API**: The set of existing Express backend endpoints that expose the user's MongoDB health data.
- **AI_Service**: The Python FastAPI backend deployed on Render's free tier that acts as a relay between the browser and Gemini Live API, executes Tool_Calls against MongoDB, and communicates with the frontend via WebSockets.
- **AI_Route**: The WebSocket endpoint on the AI_Service (`/ws/ai`) that handles the browser connection, relays audio to/from the Live_API_Session, and executes Tool_Calls.
- **Assistant_UI**: The React component that renders the chat interface, voice controls, and conversation history.
- **Web_Audio_API**: The browser-native API used to capture microphone audio as PCM_Audio and play back PCM_Audio chunks received from the AI_Service.

---

## Requirements

### Requirement 1: Conversational Text Interface

**User Story:** As a user, I want to type questions about my health data and receive natural language answers, so that I can quickly query my stats without navigating to individual pages.

#### Acceptance Criteria

1. THE Assistant_UI SHALL render a persistent chat input field and a scrollable conversation history panel.
2. WHEN the user submits a text Utterance, THE Assistant_UI SHALL send the Utterance to the AI_Route over the active WebSocket connection and THE AI_Service SHALL begin streaming a response within 5 seconds under normal network conditions.
3. WHEN the Assistant generates a response, THE Assistant_UI SHALL append the response to the conversation history and scroll to the latest message.
4. IF the WebSocket connection returns an error message, THEN THE Assistant_UI SHALL display a user-readable error message without crashing.
5. THE Assistant SHALL maintain conversation context across all Turns within a single Session (multi-turn memory).

---

### Requirement 2: Voice Input

**User Story:** As a user, I want to speak my questions aloud instead of typing, so that I can interact with the assistant hands-free.

#### Acceptance Criteria

1. WHEN the user activates voice input, THE Assistant_UI SHALL begin capturing microphone audio as raw PCM_Audio (16-bit, 16kHz) using the Web_Audio_API AudioWorklet and stream the audio chunks to the AI_Route over the active WebSocket connection.
2. THE AI_Route SHALL forward incoming PCM_Audio chunks from the browser to the Live_API_Session in real time without buffering the full utterance.
3. WHILE voice input is active, THE Assistant_UI SHALL display a visual indicator (e.g., animated microphone icon) to confirm the microphone is listening.
4. IF the browser does not support the Web_Audio_API or AudioWorklet, THEN THE Assistant_UI SHALL display a fallback message and disable the voice input button.
5. IF microphone permission is denied by the user, THEN THE Assistant_UI SHALL display a permission error and revert to text-only mode.
6. THE Gemini_Live model SHALL perform Voice Activity Detection natively; THE AI_Service SHALL NOT implement custom VAD logic.

---

### Requirement 3: Voice Output

**User Story:** As a user, I want the assistant to speak its responses aloud, so that I can receive answers without reading the screen.

#### Acceptance Criteria

1. WHEN the Gemini_Live model produces audio output, THE AI_Route SHALL forward the raw PCM_Audio chunks (24kHz) to the browser over the WebSocket connection as they are received, without buffering the full response.
2. WHEN the Assistant_UI receives PCM_Audio chunks, THE Assistant_UI SHALL play them back in sequence using the Web_Audio_API so that audio begins playing as soon as the first chunk arrives.
3. WHILE the Assistant is speaking, THE Assistant_UI SHALL display a visual indicator (e.g., animated waveform or speaking icon).
4. WHERE the user has previously muted audio output in the current Session, THE Assistant_UI SHALL skip audio playback and display text only.
5. THE Assistant_UI SHALL provide a mute/unmute toggle that persists for the duration of the Session.

---

### Requirement 4: Interruption Handling (Barge-In)

**User Story:** As a user, I want to interrupt the assistant mid-speech to ask a follow-up or correction, so that the conversation feels natural and responsive.

#### Acceptance Criteria

1. WHEN the user speaks while the Assistant is producing audio output, THE AI_Route SHALL continue streaming the new PCM_Audio input to the Live_API_Session without waiting for the current response to complete.
2. THE Gemini_Live model SHALL handle barge-in natively by stopping the current response and processing the new audio input; THE AI_Service SHALL NOT implement custom interruption logic.
3. WHEN the Gemini_Live model signals that the current response has been interrupted, THE AI_Route SHALL notify the Assistant_UI to stop audio playback immediately.
4. WHEN an Interruption occurs, THE Gemini_Live model SHALL treat the new audio input as the next Turn in the existing Live_API_Session, preserving prior conversation context.

---

### Requirement 5: Health Data Retrieval via Tool Calls

**User Story:** As a user, I want the assistant to answer questions using my actual health data, so that I get accurate, personalized responses rather than generic advice.

#### Acceptance Criteria

1. THE AI_Service SHALL expose a set of Tool_Calls that the Gemini_Live model can invoke to fetch health data from MongoDB.
2. WHEN Gemini_Live invokes a Tool_Call, THE AI_Service SHALL query the appropriate MongoDB collection and return structured JSON data to the model within 3 seconds.
3. THE AI_Service SHALL support Tool_Calls for the following data domains: sleep logs, water intake logs, gym workout logs, diet/meal logs, and clean timer records.
4. WHEN a Tool_Call requests data for a specific date range, THE AI_Service SHALL return only records within that range, using the existing `date` field (yyyy-MM-dd format) on each model.
5. IF a Tool_Call returns no records for the requested range, THEN THE AI_Service SHALL return an empty result set and THE Assistant SHALL inform the user that no data was found for that period.
6. THE AI_Service SHALL enforce a maximum of 5 Tool_Call invocations per Turn to prevent runaway API usage.

---

### Requirement 6: Sleep Data Queries

**User Story:** As a user, I want to ask questions like "how was my sleep this week?" and get answers from my actual sleep logs, so that I can understand my sleep patterns conversationally.

#### Acceptance Criteria

1. WHEN the user asks about sleep, THE Assistant SHALL invoke the sleep Tool_Call with the relevant date range.
2. THE sleep Tool_Call SHALL return fields: `date`, `duration` (minutes), `quality`, `sleptAt`, `wokeUpAt`, and `isComplete` for each matching SleepLog document.
3. WHEN summarizing sleep data, THE Assistant SHALL calculate and state average duration, most common quality rating, and total nights logged for the requested period.
4. IF a SleepLog has `isComplete: false`, THEN THE Assistant SHALL exclude it from duration and quality calculations and note it as an incomplete entry.

---

### Requirement 7: Water Intake Queries

**User Story:** As a user, I want to ask "did I hit my water goal today?" and get an accurate answer from my intake logs, so that I can stay on top of my hydration.

#### Acceptance Criteria

1. WHEN the user asks about water intake, THE Assistant SHALL invoke the water Tool_Call with the relevant date.
2. THE water Tool_Call SHALL return fields: `date`, `totalMl`, `goal`, `goalMet`, and `entryCount` for the requested date(s).
3. WHEN the user asks about a date range, THE Assistant SHALL aggregate total intake and report how many days the goal was met out of the total days in the range.

---

### Requirement 8: Gym Workout Queries

**User Story:** As a user, I want to ask "what did I train this week?" and get a summary of my workouts, so that I can track my gym consistency conversationally.

#### Acceptance Criteria

1. WHEN the user asks about gym workouts, THE Assistant SHALL invoke the gym Tool_Call with the relevant date range.
2. THE gym Tool_Call SHALL return fields: `date`, `workoutType`, `primaryMuscle`, `secondaryMuscle`, `primaryExercises`, `secondaryExercises`, and `duration` for each matching GymLog document.
3. WHEN summarizing gym data, THE Assistant SHALL state the number of workout days, list the muscle groups trained, and note any days with no logged workout.

---

### Requirement 9: Diet and Meal Queries

**User Story:** As a user, I want to ask "what did I eat yesterday?" and get a breakdown of my meals, so that I can review my nutrition conversationally.

#### Acceptance Criteria

1. WHEN the user asks about diet, THE Assistant SHALL invoke the diet Tool_Call with the relevant date.
2. THE diet Tool_Call SHALL return fields: `date`, `foodName`, `calories`, `protein`, `carbs`, `fat`, `fiber`, and `eatenAt` for each matching DietLog document.
3. WHEN summarizing diet data, THE Assistant SHALL state total calories, total protein, total carbs, and total fat for the requested period.
4. WHEN the user asks about a specific meal or food item, THE Assistant SHALL filter results by `foodName` and report the matching entries.

---

### Requirement 10: Clean Timer Queries

**User Story:** As a user, I want to ask "how long have I been clean?" and get the current streak for my clean timers, so that I can stay motivated.

#### Acceptance Criteria

1. WHEN the user asks about a clean timer, THE Assistant SHALL invoke the clean timer Tool_Call.
2. THE clean timer Tool_Call SHALL return fields: `habitName`, `startedAt`, `isActive`, `category`, and `resetHistory` (count of resets and most recent reset date) for each CleanTimer document.
3. WHEN reporting a clean timer, THE Assistant SHALL calculate and state the current streak in days (from `startedAt` or last reset to now) and the total number of resets.
4. IF no active clean timers exist, THEN THE Assistant SHALL inform the user that no active timers were found.

---

### Requirement 11: Cost-Free Operation

**User Story:** As a user, I want the assistant to operate within free-tier API limits, so that I incur no ongoing costs for personal use.

#### Acceptance Criteria

1. THE AI_Service SHALL use the Gemini Live API with the `gemini-2.5-flash-native-audio-preview-12-2025` model exclusively, which provides 10 RPM and 250 RPD on the free tier.
2. THE AI_Service SHALL limit the conversation history sent to Gemini_Live to the last 10 Turns to control token usage per request.
3. THE AI_Service SHALL limit the Data_Context injected per Tool_Call response to a maximum of 30 records to prevent token bloat.
4. THE Assistant_UI SHALL display a warning when the user has sent 20 or more Turns in a single Session, indicating they are approaching daily usage limits.

---

### Requirement 12: Session Management

**User Story:** As a user, I want to start and end a conversation session clearly, so that I know when the assistant is active and when it is not.

#### Acceptance Criteria

1. THE Assistant_UI SHALL provide a clearly labeled button to start a new Session.
2. WHEN a Session is started, THE Assistant_UI SHALL clear the previous conversation history and initialize a new session state.
3. THE Assistant_UI SHALL provide a button to end the current Session, which stops all audio capture and playback.
4. WHILE a Session is active, THE Assistant_UI SHALL display a visible "active" indicator.
5. IF the browser tab is closed or navigated away from, THEN THE Assistant_UI SHALL automatically end the active Session and release the microphone.

---

### Requirement 13: System Prompt and Persona

**User Story:** As a user, I want the assistant to understand the context of my app and respond in a helpful, concise tone, so that interactions feel purposeful rather than generic.

#### Acceptance Criteria

1. THE AI_Service SHALL inject a system prompt into every Live_API_Session that identifies the assistant as a personal health data analyst for this specific app.
2. THE system prompt SHALL instruct Gemini_Live to: answer only health and fitness related questions, use the user's actual data via Tool_Calls before answering data questions, and keep responses under 100 words unless detail is explicitly requested.
3. IF the user asks a question unrelated to health, fitness, or their tracked data, THEN THE Assistant SHALL politely decline and redirect to supported topics.
4. THE system prompt SHALL include the current date so the Assistant can correctly interpret relative time references like "today", "yesterday", and "this week".

---

### Requirement 14: Low-Latency Audio Response Pipeline

**User Story:** As a user, I want the assistant to start speaking within 1 second of me finishing my utterance, so that the conversation feels real-time and natural rather than like waiting for a web request.

#### Acceptance Criteria

1. THE AI_Service SHALL relay PCM_Audio chunks from the Gemini_Live model to the browser as they are received over the Live_API_Session, without buffering the full response, targeting a first audio chunk delivery within 800 milliseconds of the Gemini_Live model beginning its response.
2. WHEN the Gemini_Live model begins producing audio, THE Assistant_UI SHALL begin playback within 100 milliseconds of receiving the first PCM_Audio chunk from the AI_Route.
3. THE end-to-end latency from the Gemini_Live model detecting end-of-utterance to the user hearing the first audio SHALL target 320–800 milliseconds under normal network conditions, as provided natively by the Gemini Live API audio pipeline.
4. WHEN multiple Tool_Calls are required to fulfill a single Turn, THE AI_Service SHALL execute all independent Tool_Calls in parallel rather than sequentially to minimize total data-fetch latency.
5. IF the WebSocket connection is interrupted mid-stream, THEN THE Assistant_UI SHALL display the partial text response received so far and show a reconnect option without losing prior Session context.

---

### Requirement 15: WebSocket Connection Management

**User Story:** As a user, I want the WebSocket connection to the AI service to be established automatically when I start a session and cleaned up when I'm done, so that I don't have to manage the connection manually.

#### Acceptance Criteria

1. WHEN the user starts a new Session, THE Assistant_UI SHALL establish a WebSocket connection to the AI_Route on the AI_Service before sending any audio or text input.
2. WHEN the user ends a Session, THE Assistant_UI SHALL send a close frame and cleanly terminate the WebSocket connection, and THE AI_Service SHALL close the corresponding Live_API_Session.
3. IF the WebSocket connection drops unexpectedly during an active Session, THEN THE Assistant_UI SHALL automatically attempt to reconnect up to 3 times with a 2-second delay between attempts before displaying a connection error to the user.
4. WHILE a reconnection attempt is in progress, THE Assistant_UI SHALL display a visible reconnecting indicator and disable the input field.
5. WHEN a reconnection succeeds, THE Assistant_UI SHALL restore the existing Session context so the conversation history is not lost.
6. IF the browser tab is closed or navigated away from during an active Session, THEN THE Assistant_UI SHALL send a WebSocket close frame to allow the AI_Service to release server-side Session resources and close the Live_API_Session.
