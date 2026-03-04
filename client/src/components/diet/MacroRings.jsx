import { motion } from "framer-motion";

const RADIUS = 50;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

function MacroRing({ value = 0, goal = 100, color, label, unit = "g" }) {
  const progress = Math.min(value / goal, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-2">
        <svg width={SIZE} height={SIZE} className="transform -rotate-90">
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
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold text-text-primary">
            {Math.round(value)}
            <span className="text-xs text-text-secondary">/{goal}</span>
          </div>
          <div className="text-xs text-text-secondary">{unit}</div>
        </div>
      </div>

      <div className="text-xs font-medium text-text-secondary">{label}</div>
      <div className="text-xs text-text-secondary">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}

export default function MacroRings({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4">
      <MacroRing
        value={stats?.totalProtein || 0}
        goal={stats?.proteinGoal || 150}
        color="#3b82f6"
        label="Protein"
      />
      <MacroRing
        value={stats?.totalCarbs || 0}
        goal={stats?.carbsGoal || 200}
        color="#f97316"
        label="Carbs"
      />
      <MacroRing
        value={stats?.totalFat || 0}
        goal={stats?.fatGoal || 65}
        color="#eab308"
        label="Fat"
      />
    </div>
  );
}
