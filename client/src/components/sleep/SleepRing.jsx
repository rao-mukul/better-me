import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const RADIUS = 90;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

export default function SleepRing({ totalMinutes = 0, targetHours = 8 }) {
  const totalHours = totalMinutes / 60;
  const progress = Math.min(totalHours / targetHours, 1);
  const [prevGoalMet, setPrevGoalMet] = useState(false);
  const goalMet = progress >= 1;

  // Animated number counter
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayHours = useTransform(springValue, (v) => v.toFixed(1));
  const [renderedHours, setRenderedHours] = useState("0.0");

  useEffect(() => {
    springValue.set(totalHours);
  }, [totalHours, springValue]);

  useEffect(() => {
    const unsub = displayHours.on("change", (v) => setRenderedHours(v));
    return unsub;
  }, [displayHours]);

  // Track goal met for celebration
  useEffect(() => {
    setPrevGoalMet(goalMet);
  }, [goalMet]);

  const justHitGoal = goalMet && !prevGoalMet && totalMinutes > 0;

  // Color based on progress (purple theme for sleep)
  const getColor = () => {
    if (progress >= 1) return "#34d399"; // success green
    if (progress >= 0.7) return "#a78bfa"; // purple
    return "#c084fc"; // lighter purple
  };

  const getGlowColor = () => {
    if (progress >= 1) return "rgba(52, 211, 153, 0.3)";
    if (progress >= 0.7) return "rgba(167, 139, 250, 0.25)";
    return "rgba(192, 132, 252, 0.2)";
  };

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Goal-hit ripple */}
      {justHitGoal && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-success/40"
              style={{ width: SIZE, height: SIZE }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5 + i * 0.2, opacity: 0 }}
              transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
            />
          ))}
        </>
      )}

      <svg width={SIZE} height={SIZE} className="transform -rotate-90">
        <defs>
          <filter id="sleep-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(36, 51, 82, 0.6)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={getColor()}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{
            strokeDashoffset,
            filter: progress > 0.5 ? "url(#sleep-glow)" : "none",
          }}
          transition={{
            type: "spring",
            stiffness: 40,
            damping: 15,
            delay: 0.1,
          }}
        />

        {/* Glow effect when near/past goal */}
        {progress >= 0.7 && (
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={getGlowColor()}
            strokeWidth={STROKE + 6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <motion.div
          key={renderedHours}
          initial={{ scale: 1.15, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="text-4xl font-bold text-text-primary tabular-nums"
        >
          {renderedHours}h
        </motion.div>
        <div className="text-xs text-text-secondary mt-0.5">
          of {targetHours}h
        </div>
        <div className="text-xs text-text-secondary/70 mt-1">
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Goal met celebration */}
      {justHitGoal && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute -bottom-2 bg-success/20 border border-success/40 rounded-full px-4 py-1"
        >
          <p className="text-xs font-semibold text-success">
            Target reached! 🌙
          </p>
        </motion.div>
      )}
    </div>
  );
}
