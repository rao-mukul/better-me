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
        <p className="text-xs text-text-secondary">{data.dayLabel}</p>
        <p className="text-sm font-semibold text-text-primary">
          {data.totalHours}h
        </p>
        {data.averageQuality !== "none" && (
          <p className="text-xs text-text-secondary capitalize">
            {data.averageQuality} quality
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function SleepWeeklyChart({ data = [], targetHours = 8 }) {
  // Don't render chart if no data to avoid dimension issues
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Last 7 Days Sleep
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
        Last 7 Days Sleep
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
              y={targetHours}
              stroke="rgba(167, 139, 250, 0.4)"
              strokeDasharray="4 4"
            />
            <Bar dataKey="totalHours" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.targetMet ? "#34d399" : "#a78bfa"}
                  fillOpacity={entry.totalHours > 0 ? 0.7 : 0.15}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-purple-400/70" />
          <span className="text-xs text-text-secondary">Under target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-success/70" />
          <span className="text-xs text-text-secondary">Target met</span>
        </div>
      </div>
    </Card>
  );
}
