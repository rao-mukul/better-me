import { AnimatePresence } from 'framer-motion';
import IntakeItem from './IntakeItem';

export default function IntakeList({ logs = [], onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">No water logged yet today.</p>
        <p className="text-text-secondary/60 text-xs mt-1">Tap a button above to start tracking!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Today's Log
      </h3>
      <AnimatePresence mode="popLayout">
        {logs.map((log) => (
          <IntakeItem key={log._id} log={log} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </div>
  );
}
