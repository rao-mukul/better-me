import { motion, AnimatePresence } from "framer-motion";
import DietLogItem from "./DietLogItem";

export default function DietLogList({ logs, onDelete }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-secondary">
          No food entries logged yet. Start tracking your nutrition! 🥗
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {logs.map((log) => (
          <DietLogItem key={log._id} log={log} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
