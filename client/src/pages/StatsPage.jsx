import { motion } from "framer-motion";
import WaterCalendar from "../components/water/WaterCalendar";

export default function StatsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <WaterCalendar />
    </motion.div>
  );
}
