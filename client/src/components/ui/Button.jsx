import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-navy-700/50',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/20',
  success: 'bg-success/15 text-success hover:bg-success/25 border border-success/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
