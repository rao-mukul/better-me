import { motion } from "framer-motion";
import {
  Calendar,
  ListOrdered,
  BookOpen,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  useDietToday,
  usePopularMeals,
  useDeleteDietLog,
} from "../hooks/useDietData";
import { dietApi } from "../services/api";
import DietCalendar from "../components/diet/DietCalendar";
import DietTimeline from "../components/diet/DietTimeline";
import { getMealImageUrl } from "../utils/imageHelpers";

export default function DietStatsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("today"); // "today", "calendar", or "library"
  const [searchQuery, setSearchQuery] = useState("");
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

  // Delete meal from library
  const deleteMealMutation = useMutation({
    mutationFn: dietApi.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet", "meals"] });
      toast.success("Meal deleted from library");
    },
    onError: () => {
      toast.error("Failed to delete meal");
    },
  });

  const handleDeleteMeal = (mealId, mealName) => {
    if (window.confirm(`Delete "${mealName}" from your meal library?`)) {
      deleteMealMutation.mutate(mealId);
    }
  };

  // Filter meals based on search
  const filteredMeals = meals.filter((meal) =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
      <div className="flex items-center gap-1.5 sm:gap-2 bg-navy-800/40 border border-navy-700/30 rounded-xl p-1 sm:p-1.5 w-fit">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("today")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "today"
              ? "bg-green-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <ListOrdered size={16} className="sm:w-4.5 sm:h-4.5" />
          <span className="hidden xs:inline">Today's Log</span>
          <span className="xs:hidden">Today</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "calendar"
              ? "bg-green-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={16} className="sm:w-4.5 sm:h-4.5" />
          Calendar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setView("library")}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            view === "library"
              ? "bg-green-500 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <BookOpen size={16} className="sm:w-4.5 sm:h-4.5" />
          <span className="hidden xs:inline">Meal Library</span>
          <span className="xs:hidden">Library</span>
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
        </>
      ) : view === "calendar" ? (
        <DietCalendar />
      ) : (
        /* Meal Library View */
        <>
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-4"
          >
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-700/50 border border-navy-700/30 rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
              />
            </div>
          </motion.div>

          {/* Loading State */}
          {mealsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-4 animate-pulse"
                >
                  <div className="aspect-video bg-navy-700/40 rounded-lg mb-3" />
                  <div className="h-5 bg-navy-700/40 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-navy-700/40 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!mealsLoading && filteredMeals.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-navy-800/40 border border-navy-700/30 rounded-2xl p-12 flex flex-col items-center justify-center"
            >
              <div className="bg-navy-700/40 rounded-full p-6 mb-4">
                <UtensilsCrossed size={48} className="text-text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {searchQuery ? "No meals found" : "Your meal library is empty"}
              </h3>
              <p className="text-text-secondary text-center max-w-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Start logging meals to build your personalized meal library"}
              </p>
            </motion.div>
          )}

          {/* Meal Grid */}
          {!mealsLoading && filteredMeals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeals.map((meal) => (
                <motion.div
                  key={meal._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-navy-800/40 border border-navy-700/30 rounded-2xl overflow-hidden group"
                >
                  {/* Meal Image */}
                  <div className="relative aspect-video bg-navy-700/40 overflow-hidden">
                    {getMealImageUrl(meal, "card") ? (
                      <img
                        src={getMealImageUrl(meal, "card")}
                        alt={meal.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed
                          size={48}
                          className="text-text-secondary"
                        />
                      </div>
                    )}
                    {/* AI Badge */}
                    {meal.isAIAnalyzed && (
                      <div className="absolute top-2 right-2 bg-purple-500/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <Sparkles size={14} className="text-white" />
                        <span className="text-xs font-medium text-white">
                          AI
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meal Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-1">
                      {meal.name}
                    </h3>

                    {/* Calories */}
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {meal.calories}
                      <span className="text-sm font-normal text-text-secondary ml-1">
                        cal
                      </span>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-navy-700/40 rounded-lg px-2 py-1.5">
                        <div className="text-xs text-text-secondary">
                          Protein
                        </div>
                        <div className="text-sm font-semibold text-text-primary">
                          {meal.protein}g
                        </div>
                      </div>
                      <div className="bg-navy-700/40 rounded-lg px-2 py-1.5">
                        <div className="text-xs text-text-secondary">Carbs</div>
                        <div className="text-sm font-semibold text-text-primary">
                          {meal.carbs}g
                        </div>
                      </div>
                      <div className="bg-navy-700/40 rounded-lg px-2 py-1.5">
                        <div className="text-xs text-text-secondary">Fat</div>
                        <div className="text-sm font-semibold text-text-primary">
                          {meal.fat}g
                        </div>
                      </div>
                    </div>

                    {/* Times Logged */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Clock size={14} />
                        <span className="text-xs">
                          Logged {meal.timesLogged} time
                          {meal.timesLogged !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {meal.category && (
                        <span className="text-xs bg-navy-700/40 px-2 py-1 rounded-full text-text-secondary capitalize">
                          {meal.category}
                        </span>
                      )}
                    </div>

                    {/* Serving Size */}
                    {meal.servingSize && (
                      <div className="text-xs text-text-secondary mb-3">
                        Serving: {meal.servingSize}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteMeal(meal._id, meal.name)}
                        disabled={deleteMealMutation.isPending}
                        className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Delete</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
