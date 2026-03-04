import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const RADIUS = 90;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

export default function WaterRing({ totalMl = 0, goal = 2500 }) {
  const progress = Math.min(totalMl / goal, 1);
  const [prevGoalMet, setPrevGoalMet] = useState(false);
  const goalMet = progress >= 1;

  // Animated number counter
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayMl = useTransform(springValue, (v) => Math.round(v));
  const [renderedMl, setRenderedMl] = useState(0);

  useEffect(() => {
    springValue.set(totalMl);
  }, [totalMl, springValue]);

  useEffect(() => {
    const unsub = displayMl.on('change', (v) => setRenderedMl(v));
    return unsub;
  }, [displayMl]);

  // Track goal met for celebration
  useEffect(() => {
    setPrevGoalMet(goalMet);
  }, [goalMet]);

  const justHitGoal = goalMet && !prevGoalMet && totalMl > 0;

  // Color based on progress
  const getColor = () => {
    if (progress >= 1) return '#34d399';
    if (progress >= 0.7) return '#06b6d4';
    return '#38bdf8';
  };

  const getGlowColor = () => {
    if (progress >= 1) return 'rgba(52, 211, 153, 0.3)';
    if (progress >= 0.7) return 'rgba(6, 182, 212, 0.25)';
    return 'rgba(56, 189, 248, 0.2)';
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
              transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      <svg width={SIZE} height={SIZE} className="transform -rotate-90">
        <defs>
          <filter id="glow">
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
          animate={{ strokeDashoffset }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
          filter="url(#glow)"
          style={{ filter: `drop-shadow(0 0 8px ${getGlowColor()})` }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color: getColor() }}
          animate={goalMet ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {renderedMl}
        </motion.span>
        <span className="text-sm text-text-secondary mt-0.5">
          of {(goal / 1000).toFixed(1)}L goal
        </span>
        {goalMet && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-success mt-1"
          >
            Goal reached!
          </motion.span>
        )}
      </div>
    </div>
  );
}
