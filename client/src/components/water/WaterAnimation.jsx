import { motion, AnimatePresence } from "framer-motion";
import { Droplet } from "lucide-react";

export default function WaterAnimation({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Multiple water droplets - reduced and more subtle */}
          {[...Array(3)].map((_, i) => {
            const angle = (i / 3) * 360;
            const distance = 40;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;

            return (
              <motion.div
                key={i}
                initial={{
                  opacity: 0.6,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: [0.8, 1, 0],
                  x: x,
                  y: y,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: i * 0.08,
                }}
                className="absolute"
              >
                <Droplet size={18} className="text-primary fill-primary/20" />
              </motion.div>
            );
          })}

          {/* Center ripple effect - more subtle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{
              scale: [0.8, 1.5, 2],
              opacity: [0.4, 0.15, 0],
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute w-24 h-24 border-2 border-primary rounded-full"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{
              scale: [0.8, 1.8, 2.3],
              opacity: [0.3, 0.1, 0],
            }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="absolute w-24 h-24 border-2 border-primary rounded-full"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
