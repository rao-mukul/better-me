import { motion } from "framer-motion";

export function Skeleton({ className = "", variant = "default" }) {
  const variants = {
    default: "bg-navy-800/60",
    light: "bg-navy-700/40",
    text: "bg-navy-800/40 h-4 rounded",
    circle: "rounded-full bg-navy-800/60",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`animate-pulse ${variants[variant]} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-800/40 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton variant="circle" className="w-10 h-10" />
        <Skeleton className="h-6 w-32 rounded" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function RingSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <Skeleton variant="circle" className="w-48 h-48" />
    </div>
  );
}
