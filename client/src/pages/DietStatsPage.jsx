import { motion } from "framer-motion";
import { Calendar, ArrowRight, ListOrdered } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDietToday,
  usePopularMeals,
  useDeleteDietLog,
} from "../hooks/useDietData";
import DietCalendar from "../components/diet/DietCalendar";
import DietTimeline from "../components/diet/DietTimeline";

export default function DietStatsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("today"); // "today" or "calendar"
  const { data: todayData, isLoading: todayLoading } = useDietToday();
  const { data: popularMeals, isLoading: mealsLoading } = usePopularMeals();
  const deleteDietLog = useDeleteDietLog();

  // Extract totals and logs from the API response
  const totals = todayData?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    count: 0,
  };

  const logs = todayData?.logs || [];
  const meals = popularMeals || [];

  const handleDelete = (id) => {
    deleteDietLog.mutate(id);
  };

  if (todayLoading && view === "today") {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-12 rounded-2xl bg-navy-800/60 w-64" />
        <div className="h-32 rounded-2xl bg-navy-800/60" />
        <div className="h-96 rounded-2xl bg-navy-800/60" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("today")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "today"
              ? "bg-green-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <ListOrdered size={18} />
          Today's Log
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "calendar"
              ? "bg-green-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={18} />
          Calendar
        </motion.button>
      </div>

      {/* Content */}
      {view === "today" ? (
        <>
          {/* Compact Nutrition Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-5"
          >
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Today's Nutrition
            </h3>

            {totals.count > 0 ? (
              <div className="flex items-center justify-around gap-4">
                {/* Calories - Larger */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-navy-700/40"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${226} ${226}`}
                        className="text-green-400"
                      />
                    </svg>
                    <div className="text-center">
                      <div className="text-xl font-bold text-text-primary">
                        {totals.calories}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary mt-1">
                    Calories
                  </span>
                </div>

                {/* Protein */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        className="text-navy-700/40"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${176} ${176}`}
                        className="text-blue-400"
                      />
                    </svg>
                    <div className="text-center">
                      <div className="text-sm font-bold text-text-primary">
                        {totals.protein}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary mt-1">
                    Protein
                  </span>
                </div>

                {/* Carbs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        className="text-navy-700/40"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${176} ${176}`}
                        className="text-orange-400"
                      />
                    </svg>
                    <div className="text-center">
                      <div className="text-sm font-bold text-text-primary">
                        {totals.carbs}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary mt-1">
                    Carbs
                  </span>
                </div>

                {/* Fat */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        className="text-navy-700/40"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${176} ${176}`}
                        className="text-yellow-400"
                      />
                    </svg>
                    <div className="text-center">
                      <div className="text-sm font-bold text-text-primary">
                        {totals.fat}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary mt-1">Fat</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-text-secondary text-sm">
                  No meals logged today yet
                </p>
              </div>
            )}
          </motion.div>

          {/* Meal Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-6">
              Meal Timeline
            </h3>
            <DietTimeline logs={logs} onDelete={handleDelete} />
          </motion.div>

          {/* Meal Library Button */}
          {mealsLoading ? (
            <div className="h-20 rounded-xl bg-navy-800/60 animate-pulse" />
          ) : (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/meal-library")}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl p-4 transition-colors flex items-center justify-between group"
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
          )}
        </>
      ) : (
        <DietCalendar />
      )}
    </motion.div>
  );
}
