import { useCallback, useRef } from "react";
import { Loader2, AlertCircle, WifiOff } from "lucide-react";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioPlayback } from "./useAudioPlayback";
import { useAssistantSession } from "./useAssistantSession";
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import VoiceControls from "./VoiceControls";

/**
 * AssistantUI — root component wiring all hooks and sub-components.
 *
 * Hook wiring order matters:
 *   1. useAssistantSession owns isMuted state
 *   2. useAudioPlayback receives isMuted so it can discard chunks when muted
 *   3. useAssistantSession receives the playback object so it can enqueue/interrupt
 *
 * We break the circular dependency by giving the session hook a stable ref
 * to the playback object that gets updated after both hooks initialise.
 */
export default function AssistantUI() {
  // Stable ref that bridges session ↔ playback without circular hook deps
  const playbackRef = useRef(null);

  const session = useAssistantSession({
    enqueueChunk: (buf) => playbackRef.current?.enqueueChunk(buf),
    interrupt: () => playbackRef.current?.interrupt(),
  });

  // Now create playback with live isMuted from session
  const audioPlayback = useAudioPlayback(session.isMuted);
  playbackRef.current = audioPlayback;

  const audioCapture = useAudioCapture();

  // Keep a stable ref to sendAudioChunk so the capture callback never goes stale
  const sendAudioChunkRef = useRef(session.sendAudioChunk);
  sendAudioChunkRef.current = session.sendAudioChunk;

  const handleMicToggle = useCallback(() => {
    if (audioCapture.isCapturing) {
      audioCapture.stopCapture();
    } else {
      audioCapture.startCapture((chunk) => {
        sendAudioChunkRef.current(chunk);
      });
    }
  }, [audioCapture]);

  const { status, turns, isMuted, turnCount, turnLimitWarning } = session;
  const isActive = status === "active";
  const isConnecting = status === "connecting";
  const isReconnecting = status === "reconnecting";
  const isError = status === "error";

  return (
    <div className="flex flex-col h-full bg-navy-800/30 rounded-2xl border border-navy-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">AI Assistant</span>
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
          {(isReconnecting || isConnecting) && (
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Loader2 size={12} className="animate-spin" />
              {isReconnecting ? "Reconnecting…" : "Connecting…"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(isActive || isReconnecting) && (
            <button
              onClick={session.endSession}
              className="text-xs px-3 py-1.5 rounded-lg bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
            >
              End Session
            </button>
          )}
          {(status === "idle" || isError) && (
            <button
              onClick={session.startSession}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Start Session
            </button>
          )}
        </div>
      </div>

      {/* Turn limit warning */}
      {turnLimitWarning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400">
          <AlertCircle size={13} />
          Approaching session limit ({turnCount} turns). Consider starting a new session soon.
        </div>
      )}

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-danger/10 border-b border-danger/20 text-xs text-danger">
          <WifiOff size={13} />
          Connection lost after 3 attempts. Start a new session to continue.
        </div>
      )}

      {/* Chat history */}
      <ChatHistory turns={turns} />

      {/* Voice controls */}
      <VoiceControls
        status={status}
        isListening={audioCapture.isCapturing}
        isMuted={isMuted}
        isSpeaking={audioPlayback.isSpeaking}
        permissionError={audioCapture.permissionError}
        onMicToggle={handleMicToggle}
        onMuteToggle={session.toggleMute}
      />

      {/* Text input */}
      <ChatInput status={status} onSend={session.sendText} />
    </div>
  );
}
