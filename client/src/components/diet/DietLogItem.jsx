import { motion } from "framer-motion";
import { Trash2, Utensils } from "lucide-react";
import { format } from "date-fns";

export default function DietLogItem({ log, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-navy-800/40 border border-navy-700/30 rounded-lg p-3 hover:border-green-500/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Utensils size={14} className="text-green-400 shrink-0" />
            <h4 className="text-sm font-medium text-text-primary truncate">
              {log.foodName}
            </h4>
            {log.servingSize && (
              <span className="text-xs text-text-secondary shrink-0">
                ({log.servingSize})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
            <span>{format(new Date(log.eatenAt), "h:mm a")}</span>
            <span className="text-green-400 font-medium">
              {log.calories} cal
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">P:</span>
              <span className="text-text-primary font-medium">
                {log.protein}g
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">C:</span>
              <span className="text-text-primary font-medium">
                {log.carbs}g
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-secondary">F:</span>
              <span className="text-text-primary font-medium">{log.fat}g</span>
            </div>
          </div>

          {log.notes && (
            <p className="text-xs text-text-secondary mt-2 italic">
              {log.notes}
            </p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(log._id)}
          className="p-2 rounded-lg bg-navy-700/30 hover:bg-red-500/20 text-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}
