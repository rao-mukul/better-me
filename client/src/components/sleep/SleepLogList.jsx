import { AnimatePresence } from "framer-motion";
import SleepLogItem from "./SleepLogItem";

export default function SleepLogList({ logs = [], onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">
          No sleep logged yet today.
        </p>
        <p className="text-text-secondary/60 text-xs mt-1">
          Add your sleep to start tracking!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Today's Sleep
      </h3>
      <AnimatePresence mode="popLayout">
        {logs.map((log) => (
          <SleepLogItem key={log._id} log={log} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
