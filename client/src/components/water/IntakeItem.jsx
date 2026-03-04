import { motion } from 'framer-motion';
import { Trash2, GlassWater, CupSoda, Droplets } from 'lucide-react';

const typeIcons = {
  glass: GlassWater,
  bottle: CupSoda,
  custom: Droplets,
};

const typeColors = {
  glass: 'text-primary',
  bottle: 'text-accent',
  custom: 'text-text-secondary',
};

export default function IntakeItem({ log, onDelete }) {
  const Icon = typeIcons[log.type] || Droplets;
  const color = typeColors[log.type] || 'text-text-secondary';
  const time = new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center gap-3 bg-navy-800/40 border border-navy-700/30 rounded-xl px-3.5 py-3 mb-2"
    >
      <div className={`p-2 rounded-lg bg-navy-700/40 ${color}`}>
        <Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{log.label}</p>
        <p className="text-xs text-text-secondary">{time}</p>
      </div>

      <span className="text-sm font-semibold text-text-primary tabular-nums">
        {log.amount} ml
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onDelete(log._id)}
        className="p-1.5 rounded-lg text-text-secondary/50 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
      >
        <Trash2 size={15} />
      </motion.button>
    </motion.div>
  );
}
