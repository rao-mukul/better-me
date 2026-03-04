import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import Card from "../ui/Card";

const intensityColors = {
  light: "#60a5fa",
  moderate: "#fb923c",
  intense: "#f87171",
  none: "#64748b",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-navy-800 border border-navy-700/50 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-text-secondary">{data.dayLabel}</p>
        <p className="text-sm font-semibold text-text-primary">
          {data.totalWorkouts} workout{data.totalWorkouts !== 1 ? "s" : ""}
        </p>
        {data.totalMinutes > 0 && (
          <p className="text-xs text-text-secondary">
            {data.totalMinutes} minutes
          </p>
        )}
        {data.averageIntensity !== "none" && (
          <p className="text-xs text-text-secondary capitalize">
            {data.averageIntensity} intensity
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function GymWeeklyChart({ data = [] }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Last 7 Days Workouts
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="totalWorkouts" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.totalWorkouts > 0
                      ? intensityColors[entry.averageIntensity] || "#fb923c"
                      : "#64748b"
                  }
                  fillOpacity={entry.totalWorkouts > 0 ? 0.7 : 0.15}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-400/70" />
          <span className="text-xs text-text-secondary">Light</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-400/70" />
          <span className="text-xs text-text-secondary">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400/70" />
          <span className="text-xs text-text-secondary">Intense</span>
        </div>
      </div>
    </Card>
  );
}
