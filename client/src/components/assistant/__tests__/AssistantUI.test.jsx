import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the hooks so we control state without real WebSocket / AudioContext
vi.mock("../useAssistantSession", () => ({
  useAssistantSession: vi.fn(),
}));
vi.mock("../useAudioCapture", () => ({
  useAudioCapture: vi.fn(),
}));
vi.mock("../useAudioPlayback", () => ({
  useAudioPlayback: vi.fn(),
}));

import { useAssistantSession } from "../useAssistantSession";
import { useAudioCapture } from "../useAudioCapture";
import { useAudioPlayback } from "../useAudioPlayback";
import AssistantUI from "../AssistantUI";
import VoiceControls from "../VoiceControls";
import ChatHistory from "../ChatHistory";

// Default mock implementations
const makeSessionMock = (overrides = {}) => ({
  status: "idle",
  turns: [],
  isMuted: false,
  turnCount: 0,
  turnLimitWarning: false,
  startSession: vi.fn(),
  endSession: vi.fn(),
  sendText: vi.fn(),
  sendAudioChunk: vi.fn(),
  toggleMute: vi.fn(),
  ...overrides,
});

const makeCaptureMock = (overrides = {}) => ({
  isCapturing: false,
  permissionError: null,
  startCapture: vi.fn(),
  stopCapture: vi.fn(),
  ...overrides,
});

const makePlaybackMock = (overrides = {}) => ({
  isSpeaking: false,
  enqueueChunk: vi.fn(),
  interrupt: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  useAssistantSession.mockReturnValue(makeSessionMock());
  useAudioCapture.mockReturnValue(makeCaptureMock());
  useAudioPlayback.mockReturnValue(makePlaybackMock());
});

// ---------------------------------------------------------------------------
// AssistantUI tests
// ---------------------------------------------------------------------------

describe("AssistantUI", () => {
  it("renders Start Session button when status is idle", () => {
    render(<AssistantUI />);
    expect(screen.getByText("Start Session")).toBeInTheDocument();
  });

  it("calls startSession when Start Session button is clicked", () => {
    const startSession = vi.fn();
    useAssistantSession.mockReturnValue(makeSessionMock({ startSession }));
    render(<AssistantUI />);
    fireEvent.click(screen.getByText("Start Session"));
    expect(startSession).toHaveBeenCalledOnce();
  });

  it("renders Live indicator when status is active", () => {
    useAssistantSession.mockReturnValue(makeSessionMock({ status: "active" }));
    render(<AssistantUI />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders End Session button when status is active", () => {
    useAssistantSession.mockReturnValue(makeSessionMock({ status: "active" }));
    render(<AssistantUI />);
    expect(screen.getByText("End Session")).toBeInTheDocument();
  });

  it("renders reconnecting indicator when status is reconnecting", () => {
    useAssistantSession.mockReturnValue(makeSessionMock({ status: "reconnecting" }));
    render(<AssistantUI />);
    expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
  });

  it("renders error banner when status is error", () => {
    useAssistantSession.mockReturnValue(makeSessionMock({ status: "error" }));
    render(<AssistantUI />);
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
  });

  it("renders turn limit warning banner when turnLimitWarning is true", () => {
    useAssistantSession.mockReturnValue(
      makeSessionMock({ turnLimitWarning: true, turnCount: 21 })
    );
    render(<AssistantUI />);
    expect(screen.getByText(/approaching session limit/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VoiceControls tests
// ---------------------------------------------------------------------------

describe("VoiceControls", () => {
  const defaultProps = {
    status: "active",
    isListening: false,
    isMuted: false,
    isSpeaking: false,
    permissionError: null,
    onMicToggle: vi.fn(),
    onMuteToggle: vi.fn(),
  };

  it("disables mic button when AudioWorklet is not supported", () => {
    // Temporarily remove AudioWorklet from window
    const original = window.AudioWorklet;
    delete window.AudioWorklet;

    render(<VoiceControls {...defaultProps} />);
    const micBtn = screen.getByLabelText(/microphone/i);
    expect(micBtn).toBeDisabled();
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();

    window.AudioWorklet = original;
  });

  it("shows mute toggle during active session", () => {
    render(<VoiceControls {...defaultProps} />);
    expect(screen.getByLabelText(/mute speaker/i)).toBeInTheDocument();
  });

  it("hides mute toggle when session is idle", () => {
    render(<VoiceControls {...defaultProps} status="idle" />);
    expect(screen.queryByLabelText(/mute speaker/i)).not.toBeInTheDocument();
  });

  it("disables mic button when permissionError is set", () => {
    render(
      <VoiceControls
        {...defaultProps}
        permissionError="Microphone permission denied"
      />
    );
    const micBtn = screen.getByLabelText(/microphone/i);
    expect(micBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// ChatHistory tests
// ---------------------------------------------------------------------------

describe("ChatHistory", () => {
  it("shows empty state when turns is empty", () => {
    render(<ChatHistory turns={[]} />);
    expect(screen.getByText(/start a session/i)).toBeInTheDocument();
  });

  it("renders user turn right-aligned", () => {
    const turns = [
      { id: "1", role: "user", text: "Hello", timestamp: Date.now() },
    ];
    render(<ChatHistory turns={turns} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders assistant turn", () => {
    const turns = [
      { id: "2", role: "assistant", text: "Hi there", timestamp: Date.now() },
    ];
    render(<ChatHistory turns={turns} />);
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("shows blinking cursor for partial assistant turn", () => {
    const turns = [
      {
        id: "3",
        role: "assistant",
        text: "Partial…",
        timestamp: Date.now(),
        isPartial: true,
      },
    ];
    const { container } = render(<ChatHistory turns={turns} />);
    // The pulsing cursor span should be present
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
