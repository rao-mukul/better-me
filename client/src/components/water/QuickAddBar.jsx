import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassWater, CupSoda, Plus } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import CustomAmountModal from './CustomAmountModal';

const presets = [
  { type: 'glass', label: 'Glass', sublabel: '250 ml', amount: 250, icon: GlassWater, sound: 'drop' },
  { type: 'bottle', label: 'Bottle', sublabel: '1 L', amount: 1000, icon: CupSoda, sound: 'splash' },
];

export default function QuickAddBar({ onAdd, disabled }) {
  const [customOpen, setCustomOpen] = useState(false);
  const { playDrop, playSplash } = useSound();

  const handlePreset = (preset) => {
    if (disabled) return;
    onAdd({ amount: preset.amount, type: preset.type, label: `${preset.label} (${preset.sublabel})` });
    if (preset.sound === 'drop') playDrop();
    else playSplash();
  };

  const handleCustom = (amount) => {
    onAdd({ amount, type: 'custom', label: `Custom (${amount}ml)` });
    playDrop();
    setCustomOpen(false);
  };

  return (
    <>
      <div className="flex gap-3 justify-center">
        {presets.map((preset) => (
          <motion.button
            key={preset.type}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => handlePreset(preset)}
            disabled={disabled}
            className="flex flex-col items-center gap-1.5 bg-navy-800/60 backdrop-blur-sm border border-navy-700/50 rounded-2xl px-6 py-4 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <preset.icon size={26} className="text-primary" />
            <span className="text-sm font-medium text-text-primary">{preset.label}</span>
            <span className="text-xs text-text-secondary">{preset.sublabel}</span>
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setCustomOpen(true)}
          disabled={disabled}
          className="flex flex-col items-center gap-1.5 bg-navy-800/60 backdrop-blur-sm border border-navy-700/50 rounded-2xl px-6 py-4 hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus size={26} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">Custom</span>
          <span className="text-xs text-text-secondary">Any ml</span>
        </motion.button>
      </div>

      <CustomAmountModal
        isOpen={customOpen}
        onClose={() => setCustomOpen(false)}
        onAdd={handleCustom}
      />
    </>
  );
}
