import { motion } from "framer-motion";
import GymCalendar from "../components/gym/GymCalendar";

export default function GymStatsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <GymCalendar />
    </motion.div>
  );
}
