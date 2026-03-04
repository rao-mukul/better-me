import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const quickAmounts = [100, 150, 200, 300, 500, 750];

export default function CustomAmountModal({ isOpen, onClose, onAdd }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(amount, 10);
    if (val >= 1 && val <= 5000) {
      onAdd(val);
      setAmount('');
    }
  };

  const handleQuickSelect = (val) => {
    onAdd(val);
    setAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Amount">
      <div className="flex flex-wrap gap-2 mb-4">
        {quickAmounts.map((val) => (
          <button
            key={val}
            onClick={() => handleQuickSelect(val)}
            className="px-3 py-1.5 text-sm rounded-lg bg-navy-700/50 text-text-secondary hover:text-text-primary hover:bg-navy-700 border border-navy-600/30 transition-colors cursor-pointer"
          >
            {val} ml
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter ml (1-5000)"
          min="1"
          max="5000"
          className="flex-1 px-4 py-2.5 rounded-xl bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder-text-secondary/60 outline-none focus:border-primary/50 transition-colors"
          autoFocus
        />
        <Button
          type="submit"
          disabled={!amount || parseInt(amount, 10) < 1 || parseInt(amount, 10) > 5000}
          className="disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </Button>
      </form>
    </Modal>
  );
}
