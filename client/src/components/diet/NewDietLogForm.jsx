import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heic2any from "heic2any";
import {
  Camera,
  Image as ImageIcon,
  X,
  Search,
  Loader2,
  Check,
  Edit2,
  ChevronRight,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  useSearchMeals,
  useAnalyzeMealImage,
  useGetMealNutrition,
  useSaveMeal,
  useLogMeal,
} from "../../hooks/useDietData";

const mealCategories = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍎" },
];

export default function NewDietLogForm({ onSuccess }) {
  // UI State
  const [step, setStep] = useState("search"); // search, capture, analyze, approve, nutrition, done
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);

  // Meal Data
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);

  // Form Data
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Hooks
  const { data: searchResults, isLoading: isSearching } = useSearchMeals(
    searchQuery.length >= 2 ? searchQuery : "",
  );
  const analyzeMeal = useAnalyzeMealImage();
  const getNutrition = useGetMealNutrition();
  const saveMeal = useSaveMeal();
  const logMeal = useLogMeal();

  // Reset form
  const resetForm = () => {
    setStep("search");
    setSearchQuery("");
    setSelectedMeal(null);
    setCapturedImage(null);
    setImagePreview(null);
    setAiAnalysis(null);
    setImageData(null);
    setNutritionData(null);
    setMealName("");
    setMealDescription("");
    setCategory("other");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setServingSize("");
  };

  // Handle meal selection from search
  const handleSelectMeal = (meal) => {
    setSelectedMeal(meal);
    setMealName(meal.name);
    setMealDescription(meal.description || "");
    setCalories(meal.calories);
    setProtein(meal.protein);
    setCarbs(meal.carbs);
    setFat(meal.fat);
    setServingSize(meal.servingSize || "");
    setCategory(meal.category || "other");

    // Skip directly to nutrition step since we already have all data
    setStep("nutrition");
  };

  // Handle image capture/upload
  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Image selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    try {
      let processedFile = file;

      // Check if the file is HEIC/HEIF format
      // Note: iPhone photos might have empty MIME type, so check extension too
      const isHEIC =
        /\.(heic|heif)$/i.test(file.name) ||
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        (!file.type && /\.(heic|heif)$/i.test(file.name));

      if (isHEIC) {
        console.log("Converting HEIC image to JPEG...");
        try {
          // Convert HEIC to JPEG
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8, // Reduced quality to keep file size smaller
          });

          // Create a new File object from the converted Blob
          const convertedFile = new File(
            [Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob],
            file.name.replace(/\.(heic|heif)$/i, ".jpg"),
            { type: "image/jpeg" },
          );

          console.log("HEIC conversion successful:", {
            originalSize: file.size,
            convertedSize: convertedFile.size,
            type: convertedFile.type,
          });

          processedFile = convertedFile;
        } catch (conversionError) {
          console.error("HEIC conversion error:", conversionError);
          alert(
            "Failed to convert HEIC image. Please try a different photo or change your camera settings to capture as JPEG.",
          );
          return;
        }
      }

      // Check file size (client-side validation)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (processedFile.size > maxSize) {
        alert(
          `Image is too large (${(processedFile.size / 1024 / 1024).toFixed(1)}MB). Please use a smaller image (max 5MB).`,
        );
        return;
      }

      console.log("Processed file ready:", {
        name: processedFile.name,
        type: processedFile.type,
        size: processedFile.size,
      });

      setCapturedImage(processedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log("Image preview created");
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        alert("Failed to read image file. Please try again.");
      };
      reader.readAsDataURL(processedFile);
      setStep("analyze");
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Failed to process image. Please try again.");
    }
  };

  // Analyze image with AI
  const handleAnalyzeImage = async () => {
    if (!capturedImage) return;

    try {
      console.log("Starting image analysis...");
      console.log("Image to analyze:", {
        name: capturedImage.name,
        type: capturedImage.type,
        size: capturedImage.size,
      });

      const formData = new FormData();
      formData.append("mealImage", capturedImage);

      const result = await analyzeMeal.mutateAsync(formData);
      console.log("Analysis result:", result);

      setAiAnalysis(result.analysis);
      setImageData(result.imageData);

      // Pre-fill form with AI analysis
      setMealName(result.analysis.name || "");
      setMealDescription(result.analysis.description || "");
      setCategory(result.analysis.category || "other");
      setServingSize(result.analysis.portionSize || "");

      setStep("approve");
    } catch (error) {
      console.error("Analysis failed:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // More specific error messages
      let errorMessage = "Failed to analyze image. ";
      if (error.response?.status === 413) {
        errorMessage += "Image is too large. Please use a smaller photo.";
      } else if (error.response?.status === 400) {
        errorMessage +=
          error.response?.data?.error ||
          "Invalid image format. Please try again.";
      } else if (error.response?.status >= 500) {
        errorMessage += "Server error. Please try again later.";
      } else if (!error.response) {
        errorMessage += "Network error. Check your internet connection.";
      } else {
        errorMessage += "Please try again or enter meal details manually.";
      }

      alert(errorMessage);

      // Go back to search instead of non-existent "capture" step
      setCapturedImage(null);
      setImagePreview(null);
      setStep("search");
    }
  };

  // Get nutrition from AI
  const handleGetNutrition = async () => {
    if (!mealName) return;

    try {
      const result = await getNutrition.mutateAsync({
        name: mealName,
        description: mealDescription,
        portionSize: servingSize || "1 serving",
      });

      setCalories(result.calories);
      setProtein(result.protein);
      setCarbs(result.carbs);
      setFat(result.fat);
      if (result.servingSize) {
        setServingSize(result.servingSize);
      }

      setNutritionData(result);
      setStep("nutrition");
    } catch (error) {
      console.error("Nutrition fetch failed:", error);
      alert("Failed to get nutrition info. Please enter manually.");
    }
  };

  // Save and log meal
  const handleSaveAndLog = async () => {
    if (!mealName || !calories || !protein || !carbs || !fat) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Save to library first (if AI analyzed or has image)
      let mealId = selectedMeal?._id;

      if (!selectedMeal && (aiAnalysis || imageData)) {
        const savedMeal = await saveMeal.mutateAsync({
          name: mealName,
          description: mealDescription,
          aiDescription: aiAnalysis?.description || "",
          imageUrl: imageData?.imageUrl || "",
          imageId: imageData?.imageId || "",
          thumbnailUrl: imageData?.thumbnailUrl || "",
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          carbs: parseFloat(carbs),
          fat: parseFloat(fat),
          servingSize,
          category,
          tags: aiAnalysis?.tags || [],
          isAIAnalyzed: !!aiAnalysis,
        });
        mealId = savedMeal._id;
      }

      // Log the meal
      await logMeal.mutateAsync({
        mealId,
        foodName: mealName,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        servingSize,
        category,
        eatenAt: new Date().toISOString(),
      });

      setStep("done");
      setTimeout(() => {
        resetForm();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to log meal. Please try again.");
    }
  };

  // Trigger analysis when image is captured
  useEffect(() => {
    if (step === "analyze" && capturedImage) {
      handleAnalyzeImage();
    }
  }, [step, capturedImage]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* Step 1: Search or Capture */}
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meals or scan food..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-800/40 border border-navy-700/30 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-linear-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 hover:border-green-500/50 transition-colors"
              >
                <Camera size={24} className="text-green-400" />
                <span className="text-sm font-medium text-text-primary">
                  Take Photo
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-linear-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-colors"
              >
                <ImageIcon size={24} className="text-blue-400" />
                <span className="text-sm font-medium text-text-primary">
                  Upload Image
                </span>
              </motion.button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : searchResults?.length > 0 ? (
                  <>
                    <p className="text-xs text-text-secondary px-1">
                      Search Results
                    </p>
                    {searchResults.map((meal) => (
                      <MealResultCard
                        key={meal._id}
                        meal={meal}
                        onClick={() => handleSelectMeal(meal)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    <p>No meals found</p>
                    <p className="text-xs mt-1">Try taking a photo instead</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Analyzing (auto-triggered) */}
        {step === "analyze" && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Captured meal"
                className="w-48 h-48 object-cover rounded-xl mx-auto mb-6"
              />
            )}
            <Loader2
              className="animate-spin text-primary mx-auto mb-4"
              size={40}
            />
            <p className="text-text-primary font-medium mb-2">
              Analyzing your meal...
            </p>
            <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} />
              AI is identifying the food
            </p>
          </motion.div>
        )}

        {/* Step 3: Approve AI Analysis */}
        {step === "approve" && (
          <motion.div
            key="approve"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                {aiAnalysis && (
                  <Sparkles size={18} className="text-green-400" />
                )}
                Confirm Details
              </h3>
              <button
                onClick={() => setStep("search")}
                className="p-2 hover:bg-navy-700/50 rounded-lg transition-colors"
              >
                <X size={18} className="text-text-secondary" />
              </button>
            </div>

            {/* Image Preview */}
            {(imagePreview || selectedMeal?.thumbnailUrl) && (
              <div className="relative">
                <img
                  src={imagePreview || selectedMeal.thumbnailUrl}
                  alt="Meal"
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Meal Name */}
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Meal Name *
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Grilled Chicken Salad"
                className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-text-secondary mb-1.5 block">
                Description
              </label>
              <textarea
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="Additional details about the meal..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors resize-none"
              />
            </div>

            {/* Category & Serving */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary outline-none focus:border-green-500/50 transition-colors"
                >
                  <option value="other">Other</option>
                  {mealCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Serving Size
                </label>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="1 plate"
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>

            {/* AI Tags */}
            {aiAnalysis?.tags && aiAnalysis.tags.length > 0 && (
              <div>
                <p className="text-xs text-text-secondary mb-2">AI Detected:</p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {/* Check if nutrition is already complete */}
              {calories && protein && carbs && fat ? (
                // Nutrition already available - allow direct proceed
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("nutrition")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-medium transition-all"
                >
                  Continue
                  <ChevronRight size={18} />
                </motion.button>
              ) : (
                // Need to fetch nutrition from AI
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetNutrition}
                  disabled={!mealName || getNutrition.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getNutrition.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Getting Nutrition...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Get Nutrition
                      <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review Nutrition */}
        {step === "nutrition" && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Sparkles size={18} className="text-green-400" />
                Nutrition Info
              </h3>
              <button
                onClick={() => setStep("approve")}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm flex items-center gap-1"
              >
                <Edit2 size={14} />
                Edit Details
              </button>
            </div>

            {/* Info hint when from library */}
            {selectedMeal && (
              <div className="text-xs text-text-secondary bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                💡 Nutrition from your meal library. Edit values below if
                needed.
              </div>
            )}

            {/* Meal Summary */}
            <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/30">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary mb-1">
                    {mealName}
                  </h4>
                  {mealDescription && (
                    <p className="text-sm text-text-secondary">
                      {mealDescription}
                    </p>
                  )}
                </div>
                {/* Optional: Refresh nutrition button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetNutrition}
                  disabled={getNutrition.isPending}
                  className="px-3 py-1.5 rounded-lg bg-navy-700/50 hover:bg-navy-700 text-xs text-text-secondary hover:text-primary transition-all flex items-center gap-1 disabled:opacity-50"
                  title="Refresh nutrition with AI"
                >
                  <Sparkles size={12} />
                  {getNutrition.isPending ? "Updating..." : "Refresh"}
                </motion.button>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Calories *
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="200"
                  min="0"
                  step="1"
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="25"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Carbs (g) *
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="30"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1.5 block">
                  Fat (g) *
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="10"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Total Breakdown */}
            {calories && protein && carbs && fat && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Total Calories:</span>
                  <span className="font-bold text-green-400">
                    {calories} kcal
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-text-secondary">
                  <span>P: {protein}g</span>
                  <span>C: {carbs}g</span>
                  <span>F: {fat}g</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("approve")}
                className="px-6 py-3 rounded-xl bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary font-medium transition-all"
              >
                Back
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveAndLog}
                disabled={
                  !mealName ||
                  !calories ||
                  !protein ||
                  !carbs ||
                  !fat ||
                  logMeal.isPending ||
                  saveMeal.isPending
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logMeal.isPending || saveMeal.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Log Meal
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4"
            >
              <Check size={32} className="text-green-400" />
            </motion.div>
            <p className="text-text-primary font-semibold text-lg mb-2">
              Meal Logged! 🎉
            </p>
            <p className="text-text-secondary text-sm">
              {mealName} added to your diary
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Meal Result Card Component
function MealResultCard({ meal, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-navy-800/40 border border-navy-700/30 hover:border-green-500/30 transition-all text-left"
    >
      {meal.thumbnailUrl ? (
        <img
          src={meal.thumbnailUrl}
          alt={meal.name}
          className="w-14 h-14 rounded-lg object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-navy-700/50 flex items-center justify-center">
          <ImageIcon size={20} className="text-text-secondary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{meal.name}</p>
        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
          <span>{meal.calories} cal</span>
          <span>•</span>
          <span>P: {meal.protein}g</span>
          <span>•</span>
          <span>C: {meal.carbs}g</span>
          <span>•</span>
          <span>F: {meal.fat}g</span>
        </div>
        {meal.timesLogged > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
            <Clock size={12} />
            <span>Logged {meal.timesLogged}x</span>
          </div>
        )}
      </div>

      <ChevronRight size={18} className="text-text-secondary shrink-0" />
    </motion.button>
  );
}
