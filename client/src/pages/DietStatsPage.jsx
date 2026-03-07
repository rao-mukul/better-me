import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Clock } from "lucide-react";
import { useDietToday, usePopularMeals } from "../hooks/useDietData";

export default function DietStatsPage() {
  const { data: todayData, isLoading: todayLoading } = useDietToday();
  const { data: popularMeals, isLoading: mealsLoading } = usePopularMeals();

  const dietStats = todayData?.stats || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    entryCount: 0,
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

      {/* Today's Summary */}
      <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Today's Nutrition
        </h2>
        {dietStats.entryCount > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-3xl font-bold text-green-400">
                {dietStats.totalCalories}
              </div>
              <div className="text-xs text-text-secondary mt-1">Calories</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-400">
                {dietStats.totalProtein}g
              </div>
              <div className="text-xs text-text-secondary mt-1">Protein</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-3xl font-bold text-orange-400">
                {dietStats.totalCarbs}g
              </div>
              <div className="text-xs text-text-secondary mt-1">Carbs</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-3xl font-bold text-yellow-400">
                {dietStats.totalFat}g
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
      </div>

      {/* Meal Library */}
      <div className="bg-navy-800/40 border border-navy-700/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Your Meal Library
          </h2>
          <span className="text-xs text-text-secondary">
            {meals.length} meals saved
          </span>
        </div>

        {meals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meals.slice(0, 10).map((meal) => (
              <div
                key={meal._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-navy-700/30 border border-navy-600/30"
              >
                {meal.thumbnailUrl ? (
                  <img
                    src={meal.thumbnailUrl}
                    alt={meal.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-navy-600/40 flex items-center justify-center">
                    <ImageIcon size={16} className="text-text-secondary" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {meal.name}
                    </p>
                    {meal.isAIAnalyzed && (
                      <Sparkles size={12} className="text-green-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                    <span>{meal.calories} cal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                  {meal.timesLogged > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                      <Clock size={10} />
                      <span>Logged {meal.timesLogged}x</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">No meals in your library yet</p>
            <p className="text-sm text-text-secondary/70 mt-1">
              Log meals with AI to build your personal library
            </p>
          </div>
        )}

        {meals.length > 10 && (
          <p className="text-xs text-text-secondary text-center mt-4">
            Showing 10 of {meals.length} meals
          </p>
        )}
      </div>
    </motion.div>
  );
}
