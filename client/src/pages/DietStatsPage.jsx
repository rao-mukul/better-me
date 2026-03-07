import { motion } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDietToday, usePopularMeals } from "../hooks/useDietData";
import DietCalendar from "../components/diet/DietCalendar";

export default function DietStatsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("today"); // "today" or "calendar"
  const { data: todayData, isLoading: todayLoading } = useDietToday();
  const { data: popularMeals, isLoading: mealsLoading } = usePopularMeals();

  // Extract totals from the API response
  const totals = todayData?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    count: 0,
  };

  const meals = popularMeals || [];

  if (todayLoading || mealsLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-navy-800/60" />
        <div className="h-64 rounded-2xl bg-navy-800/60" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="bg-linear-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Sparkles size={24} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              AI-Powered Diet
            </h1>
            <p className="text-sm text-text-secondary">
              Awareness without obsession
            </p>
          </div>
        </div>
        <p className="text-sm text-text-secondary/80">
          Simplified tracking focused on awareness. No goals, no streaks, just
          mindful eating with AI assistance.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/meal-library")}
          className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl p-4 transition-colors flex items-center justify-between group"
        >
          <div className="text-left">
            <div className="text-sm font-medium text-green-400">
              Meal Library
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              {meals.length} meals saved
            </div>
          </div>
          <ArrowRight
            size={20}
            className="text-green-400 group-hover:translate-x-1 transition-transform"
          />
        </motion.button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1">
        <button
          onClick={() => setView("today")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            view === "today"
              ? "bg-green-500/20 text-green-400 shadow-lg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Today's Nutrition
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            view === "calendar"
              ? "bg-green-500/20 text-green-400 shadow-lg"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={16} />
          Calendar
        </button>
      </div>

      {/* Today's Summary */}
      {view === "today" && (
        <motion.div
          key="today"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Today's Nutrition
          </h2>
          {totals.count > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400">
                  {totals.calories}
                </div>
                <div className="text-xs text-text-secondary mt-1">Calories</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400">
                  {totals.protein}g
                </div>
                <div className="text-xs text-text-secondary mt-1">Protein</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-3xl font-bold text-orange-400">
                  {totals.carbs}g
                </div>
                <div className="text-xs text-text-secondary mt-1">Carbs</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-3xl font-bold text-yellow-400">
                  {totals.fat}g
                </div>
                <div className="text-xs text-text-secondary mt-1">Fat</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">No meals logged today yet</p>
              <p className="text-sm text-text-secondary/70 mt-1">
                Head to the Today page to start tracking
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <motion.div
          key="calendar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <DietCalendar />
        </motion.div>
      )}
    </motion.div>
  );
}
