import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Tooltip,
} from "recharts";
import Card from "../ui/Card";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-navy-800 border border-navy-700/50 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-text-secondary mb-1">{data.dayLabel}</p>
        <p className="text-sm font-semibold text-text-primary mb-1">
          {data.totalCalories} cal
        </p>
        <div className="space-y-0.5 text-xs">
          <p className="text-blue-400">P: {data.totalProtein}g</p>
          <p className="text-orange-400">C: {data.totalCarbs}g</p>
          <p className="text-yellow-400">F: {data.totalFat}g</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function DietWeeklyChart({ data = [], goal = 2000 }) {
  // Don't render chart if no data to avoid dimension issues
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Last 7 Days - Calories
        </h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-text-secondary">No data available yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Last 7 Days - Calories
      </h3>
      <div className="h-48 min-h-48">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <ReferenceLine
              y={goal}
              stroke="rgba(52, 211, 153, 0.3)"
              strokeDasharray="4 4"
            />
            <Bar dataKey="totalCalories" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.goalMet ? "#34d399" : "#10b981"}
                  fillOpacity={entry.totalCalories > 0 ? 0.7 : 0.15}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500/70" />
          <span className="text-xs text-text-secondary">Under goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-success/70" />
          <span className="text-xs text-text-secondary">Goal met</span>
        </div>
      </div>
    </Card>
  );
}
