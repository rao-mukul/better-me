import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { dietApi } from "../services/api";
import { toast } from "react-hot-toast";
import { getMealImageUrl } from "../utils/imageHelpers";

export default function MealLibraryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch popular meals from library
  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["diet", "meals", "popular"],
    queryFn: dietApi.getPopularMeals,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: dietApi.deleteMeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet", "meals"] });
      toast.success("Meal deleted from library");
    },
    onError: () => {
      toast.error("Failed to delete meal");
    },
  });

  // Filter meals based on search
  const filteredMeals = meals.filter((meal) =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (mealId, mealName) => {
    if (window.confirm(`Delete "${mealName}" from your meal library?`)) {
      deleteMutation.mutate(mealId);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 pb-24">
      {/* Header */}
      <div className="bg-navy-800/40 border-b border-navy-700/30 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/diet-stats")}
                className="p-2 bg-navy-700/50 hover:bg-navy-700 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Meal Library
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  {filteredMeals.length} meal
                  {filteredMeals.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <UtensilsCrossed size={28} className="text-green-400" />
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
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
        {!isLoading && filteredMeals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
          >
            <div className="bg-navy-800/40 border border-navy-700/30 rounded-full p-6 mb-4">
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
        {!isLoading && filteredMeals.length > 0 && (
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
                      <span className="text-xs font-medium text-white">AI</span>
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
                      <div className="text-xs text-text-secondary">Protein</div>
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
                      onClick={() => handleDelete(meal._id, meal.name)}
                      disabled={deleteMutation.isPending}
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
      </div>
    </div>
  );
}
