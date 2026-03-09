import { motion } from "framer-motion";
import { Droplets, Moon, Dumbbell, Utensils } from "lucide-react";

export default function ServerWakeupAnimation() {
  // Icons for the four sections
  const icons = [
    { Icon: Droplets, color: "text-blue-400", delay: 0 },
    { Icon: Utensils, color: "text-green-400", delay: 0.15 },
    { Icon: Dumbbell, color: "text-orange-400", delay: 0.3 },
    { Icon: Moon, color: "text-purple-400", delay: 0.45 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-navy-900 via-navy-800 to-navy-900"
    >
      {/* Animated gradient background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated icons in a circle */}
        <div className="relative w-32 h-32">
          {icons.map(({ Icon, color, delay }, index) => {
            const angle = (index * 360) / icons.length;
            const radius = 40;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 1],
                  opacity: [0, 1, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  delay: delay,
                  rotate: {
                    duration: 3,
                    delay: delay + 0.5,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                className="absolute"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay,
                  }}
                  className={`p-3 rounded-xl bg-navy-800/80 backdrop-blur-sm border border-navy-700/50 shadow-lg ${color}`}
                >
                  <Icon size={24} />
                </motion.div>
              </motion.div>
            );
          })}

          {/* Center pulse */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
          />
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <motion.h2
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-2xl font-bold text-text-primary mb-2"
          >
            LifeTracker
          </motion.h2>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-text-secondary text-sm">Loading</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div className="w-64 h-1 bg-navy-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-1/3 bg-linear-to-r from-transparent via-primary to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
