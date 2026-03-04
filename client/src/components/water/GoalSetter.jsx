import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X } from 'lucide-react';

export default function GoalSetter({ goal = 2500, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal));

  const handleSave = () => {
    const val = parseInt(value, 10);
    if (val >= 500 && val <= 10000) {
      onUpdate(val);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(String(goal));
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="500"
              max="10000"
              step="100"
              className="w-24 px-3 py-1.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-sm text-text-primary text-center outline-none focus:border-primary/50 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <span className="text-xs text-text-secondary">ml</span>
            <button
              onClick={handleSave}
              disabled={disabled}
              className="p-1 rounded-md text-success hover:bg-success/10 transition-colors cursor-pointer"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded-md text-text-secondary hover:bg-navy-700/50 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
          >
            <span>Daily goal: {(goal / 1000).toFixed(1)}L</span>
            <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
