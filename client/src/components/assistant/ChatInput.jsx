import { useState } from "react";
import { Send } from "lucide-react";

/**
 * ChatInput — text input + send button.
 * Disabled when session is not active.
 *
 * @param {{ status: string, onSend: (text: string) => void }} props
 */
export default function ChatInput({ status, onSend }) {
  const [text, setText] = useState("");
  const isActive = status === "active";

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !isActive) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 border-t border-navy-700/50"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!isActive}
        placeholder={isActive ? "Type a message…" : "Start a session to chat"}
        className="flex-1 bg-navy-700/40 text-text-primary placeholder-text-secondary text-sm px-4 py-2.5 rounded-xl border border-navy-600/50 outline-none focus:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      />
      <button
        type="submit"
        disabled={!isActive || !text.trim()}
        aria-label="Send message"
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
