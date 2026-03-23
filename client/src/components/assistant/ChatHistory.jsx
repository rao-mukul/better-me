import { useEffect, useRef } from "react";

/**
 * ChatHistory — scrollable conversation turns list.
 * User turns: right-aligned. Assistant turns: left-aligned.
 * Partial (streaming) assistant turns show a blinking cursor.
 *
 * @param {{ turns: import('./useAssistantSession').Turn[] }} props
 */
export default function ChatHistory({ turns }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever turns change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  if (turns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
        Start a session and say something…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {turns.map((turn) => {
        const isUser = turn.role === "user";
        const isError = turn.role === "error";

        return (
          <div
            key={turn.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? "bg-primary/20 text-text-primary rounded-br-sm"
                  : isError
                  ? "bg-danger/15 text-danger rounded-bl-sm"
                  : "bg-navy-700/60 text-text-primary rounded-bl-sm"
              }`}
            >
              {turn.text || (turn.isPartial ? "" : "…")}
              {turn.isPartial && (
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-text-secondary rounded-sm animate-pulse align-middle" />
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
