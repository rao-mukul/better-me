import { useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Loader2, Sparkles } from "lucide-react";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioPlayback } from "./useAudioPlayback";
import { useAssistantSession } from "./useAssistantSession";

/**
 * VoiceCallModal — full-screen voice conversation UI
 * Mobile-first, minimal design with real-time visual feedback
 */
export default function VoiceCallModal({ isOpen, onClose }) {
  const playbackRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const session = useAssistantSession({
    enqueueChunk: (buf) => playbackRef.current?.enqueueChunk(buf),
    interrupt: () => playbackRef.current?.interrupt(),
  });

  const audioPlayback = useAudioPlayback(session.isMuted);
  playbackRef.current = audioPlayback;

  const audioCapture = useAudioCapture();

  // Auto-start mic when session becomes active
  useEffect(() => {
    if (session.status === "active" && !audioCapture.isCapturing) {
      audioCapture.startCapture((chunk) => {
        session.sendAudioChunk(chunk);
      });
    }
  }, [session.status, audioCapture, session]);

  // Simulate audio level for visual feedback (in real impl, analyze PCM data)
  useEffect(() => {
    if (!audioCapture.isCapturing) {
      setAudioLevel(0);
      return;
    }

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.6 + 0.2);
    }, 100);

    return () => clearInterval(interval);
  }, [audioCapture.isCapturing]);

  const handleClose = useCallback(() => {
    if (audioCapture.isCapturing) {
      audioCapture.stopCapture();
    }
    if (session.status !== "idle") {
      session.endSession();
    }
    onClose();
  }, [audioCapture, session, onClose]);

  // Auto-start session when modal opens
  useEffect(() => {
    if (isOpen && session.status === "idle") {
      session.startSession();
    }
  }, [isOpen, session]);

  const isActive = session.status === "active";
  const isConnecting = session.status === "connecting";
  const isError = session.status === "error";
  const isToolCallActive = session.isToolCallActive;

  // Get last assistant message for display
  const lastAssistantMessage = session.turns
    .filter((t) => t.role === "assistant")
    .pop();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-navy-900 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-navy-700/50">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary">
                AI Assistant
              </span>
              {isActive && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-navy-700/40 transition-colors"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            {/* Status Messages */}
            {isConnecting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Connecting to AI...</p>
              </motion.div>
            )}

            {isError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-3">
                  <X size={32} className="text-danger" />
                </div>
                <p className="text-sm text-danger">Connection failed</p>
                <button
                  onClick={() => session.startSession()}
                  className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm"
                >
                  Retry
                </button>
              </motion.div>
            )}

            {/* Voice Visualizer */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 w-full max-w-sm"
              >
                {/* Circular Visualizer */}
                <div className="relative w-48 h-48">
                  {/* Outer pulsing ring when speaking */}
                  {audioPlayback.isSpeaking && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full bg-primary/20"
                    />
                  )}

                  {/* Middle ring when listening */}
                  {audioCapture.isCapturing && !audioPlayback.isSpeaking && (
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.2, 0.4],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-4 rounded-full bg-success/20"
                    />
                  )}

                  {/* Center circle */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 backdrop-blur-sm flex items-center justify-center">
                    {audioPlayback.isSpeaking ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={48} className="text-primary" />
                      </motion.div>
                    ) : (
                      <Mic
                        size={48}
                        className={audioCapture.isCapturing ? "text-success" : "text-text-secondary"}
                      />
                    )}
                  </div>

                  {/* Audio level bars */}
                  {audioCapture.isCapturing && !audioPlayback.isSpeaking && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1 h-6">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: `${Math.max(20, audioLevel * 100 * (0.5 + Math.random()))}%`,
                          }}
                          transition={{ duration: 0.1 }}
                          className="w-1 bg-success rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Text */}
                <div className="text-center space-y-2">
                  {isToolCallActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 justify-center text-xs text-primary"
                    >
                      <Loader2 size={14} className="animate-spin" />
                      <span>Fetching your data...</span>
                    </motion.div>
                  )}

                  {audioPlayback.isSpeaking && !isToolCallActive && (
                    <p className="text-sm text-primary font-medium">AI is speaking...</p>
                  )}

                  {audioCapture.isCapturing && !audioPlayback.isSpeaking && (
                    <p className="text-sm text-success font-medium">Listening...</p>
                  )}

                  {!audioCapture.isCapturing && !audioPlayback.isSpeaking && !isToolCallActive && (
                    <p className="text-sm text-text-secondary">Starting mic...</p>
                  )}

                  {/* Last message preview */}
                  {lastAssistantMessage && !lastAssistantMessage.isPartial && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-text-secondary max-w-xs line-clamp-2 mt-4"
                    >
                      {lastAssistantMessage.text}
                    </motion.p>
                  )}
                </div>

                {/* Permission Error */}
                {audioCapture.permissionError && (
                  <p className="text-xs text-danger text-center">
                    {audioCapture.permissionError}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Hint */}
          {isActive && (
            <div className="px-6 py-4 text-center text-xs text-text-secondary border-t border-navy-700/50">
              Speak naturally — I'll respond when you pause
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
