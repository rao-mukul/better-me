import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";

// Hardcoded PIN
const CORRECT_PIN = "191979";

export default function PinEntry({ onSuccess }) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if PIN is complete and correct
    if (index === 5 && value) {
      const enteredPin = newPin.join("");

      if (enteredPin === CORRECT_PIN) {
        // Call success callback - auth state managed by ProtectedTimerRoute
        onSuccess();
      } else {
        setError(true);
        // Clear PIN after error
        setTimeout(() => {
          setPin(["", "", "", "", "", ""]);
          setError(false);
          inputRefs.current[0]?.focus();
        }, 1000);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newPin = pastedData.split("");
      while (newPin.length < 6) newPin.push("");
      setPin(newPin);

      // Focus last filled input or last input
      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();

      // Check if complete
      if (pastedData.length === 6) {
        const correctPin = getStoredPin();
        if (pastedData === correctPin) {
          sessionStorage.setItem("cleanTimerAuth", "true");
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin(["", "", "", "", "", ""]);
            setError(false);
            inputRefs.current[0]?.focus();
          }, 1000);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-full">
              <Lock size={32} className="text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
            Clean Timer Protected
          </h2>
          <p className="text-sm text-text-secondary text-center mb-8">
            Enter your 6-digit PIN to continue
          </p>

          {/* PIN Input */}
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 text-center text-2xl font-bold bg-navy-700/50 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  error
                    ? "border-red-500 animate-shake"
                    : digit
                      ? "border-primary"
                      : "border-navy-600"
                }`}
              />
            ))}
          </div>

          {/* Show/Hide PIN */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            {showPin ? (
              <>
                <EyeOff size={16} />
                Hide PIN
              </>
            ) : (
              <>
                <Eye size={16} />
                Show PIN
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 text-center"
            >
              Incorrect PIN. Please try again.
            </motion.p>
          )}

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-navy-700/30">
            <p className="text-xs text-text-secondary text-center">
              Default PIN:{" "}
              <span className="font-mono font-semibold">123456</span>
            </p>
            <p className="text-xs text-text-secondary text-center mt-1">
              Contact admin to change PIN
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
