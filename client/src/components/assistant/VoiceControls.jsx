import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

const audioWorkletSupported = typeof AudioWorklet !== "undefined";

/**
 * VoiceControls — mic toggle, mute toggle, speaking indicator.
 *
 * @param {{
 *   status: string,
 *   isListening: boolean,
 *   isMuted: boolean,
 *   isSpeaking: boolean,
 *   permissionError: string | null,
 *   onMicToggle: () => void,
 *   onMuteToggle: () => void,
 * }} props
 */
export default function VoiceControls({
  status,
  isListening,
  isMuted,
  isSpeaking,
  permissionError,
  onMicToggle,
  onMuteToggle,
}) {
  const isActive = status === "active";
  const micDisabled = !isActive || !audioWorkletSupported || !!permissionError;

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {/* AudioWorklet not supported fallback */}
      {!audioWorkletSupported && (
        <span className="text-xs text-text-secondary">
          Voice input not supported in this browser — text only.
        </span>
      )}

      {/* Mic permission error */}
      {audioWorkletSupported && permissionError && (
        <span className="text-xs text-danger">{permissionError}</span>
      )}

      {/* Mic toggle */}
      <button
        onClick={onMicToggle}
        disabled={micDisabled}
        aria-label={isListening ? "Stop microphone" : "Start microphone"}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isListening
            ? "bg-danger/20 text-danger hover:bg-danger/30"
            : "bg-navy-700/40 text-text-secondary hover:text-text-primary hover:bg-navy-700/70"
        }`}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        {/* Pulsing ring while listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-xl border border-danger/50 animate-ping" />
        )}
      </button>

      {/* Mute toggle — only visible during active session */}
      {isActive && (
        <button
          onClick={onMuteToggle}
          aria-label={isMuted ? "Unmute speaker" : "Mute speaker"}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            isMuted
              ? "bg-navy-700/40 text-text-secondary hover:text-text-primary hover:bg-navy-700/70"
              : "bg-navy-700/40 text-text-secondary hover:text-text-primary hover:bg-navy-700/70"
          }`}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      {/* Speaking indicator — animated bars */}
      {isSpeaking && !isMuted && (
        <div className="flex items-end gap-0.5 h-5" aria-label="Assistant speaking">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${40 + i * 15}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
