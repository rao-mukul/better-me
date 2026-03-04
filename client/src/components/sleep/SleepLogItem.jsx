import { motion } from "framer-motion";
import { Trash2, Moon, Sunrise } from "lucide-react";
import { format } from "date-fns";

const qualityColors = {
  poor: "text-red-400",
  fair: "text-orange-400",
  good: "text-primary",
  excellent: "text-success",
};

const qualityLabels = {
  poor: "Poor",
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
};

export default function SleepLogItem({ log, onDelete }) {
  const color = qualityColors[log.quality] || "text-text-secondary";
  const sleptTime = format(new Date(log.sleptAt), "h:mm a");
  const wokeTime = format(new Date(log.wokeUpAt), "h:mm a");
  const hours = Math.floor(log.duration / 60);
  const minutes = log.duration % 60;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-center gap-3 bg-navy-800/40 border border-navy-700/30 rounded-xl px-3.5 py-3 mb-2"
    >
      <div className={`p-2 rounded-lg bg-navy-700/40 text-purple-400`}>
        <Moon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {hours}h {minutes > 0 && `${minutes}m`}
          <span className={`ml-2 text-xs ${color}`}>
            {qualityLabels[log.quality]}
          </span>
        </p>
        <p className="text-xs text-text-secondary flex items-center gap-1">
          <Moon size={10} /> {sleptTime}
          <span className="mx-1">→</span>
          <Sunrise size={10} /> {wokeTime}
        </p>
      </div>

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
