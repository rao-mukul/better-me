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
  Plus,
  RotateCcw,
  Edit3,
} from "lucide-react";
import {
  useSearchMeals,
  useAnalyzeMealImage,
  useGetMealNutrition,
  useSaveMeal,
  useLogMeal,
} from "../../hooks/useDietData";
import { getMealImageUrl } from "../../utils/imageHelpers";

const mealCategories = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍎" },
];

export default function NewDietLogForm({ onSuccess }) {
  // UI State
  const [step, setStep] = useState("search"); // search, processing, analyze, approve, nutrition, done
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [processingStatus, setProcessingStatus] = useState("");

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
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [showIngredientInput, setShowIngredientInput] = useState(false);

  // Track which fields were AI-filled for user control
  const [aiFilledFields, setAiFilledFields] = useState({
    name: false,
    description: false,
    category: false,
    servingSize: false,
    ingredients: false,
    nutrition: false,
  });

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
    setProcessingStatus("");
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
    setIngredients([]);
    setNewIngredient("");
    setShowIngredientInput(false);
    setAiFilledFields({
      name: false,
      description: false,
      category: false,
      servingSize: false,
      ingredients: false,
      nutrition: false,
    });
  };

  // Handle manual entry (skip AI analysis)
  const handleManualEntry = () => {
    setStep("approve");
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

  // Helper function to resize and compress image
  const resizeAndCompressImage = (file, maxSizeMB = 5) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDimension = 2048; // Max width or height

          // Resize if image is too large
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Start with quality 0.8 and reduce if needed
          let quality = 0.8;
          const tryCompress = (currentQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                const sizeMB = blob.size / 1024 / 1024;
                console.log(
                  `Compressed to ${sizeMB.toFixed(2)}MB with quality ${currentQuality}`,
                );

                // If still too large and we can reduce quality further, try again
                if (sizeMB > maxSizeMB && currentQuality > 0.3) {
                  tryCompress(currentQuality - 0.1);
                } else {
                  // Convert blob to File
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              },
              "image/jpeg",
              currentQuality,
            );
          };

          tryCompress(quality);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
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

    // Show processing UI immediately
    setStep("processing");
    setProcessingStatus("Preparing image...");

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
        setProcessingStatus("Converting image format...");
        try {
          // Convert HEIC to JPEG with lower quality
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.6, // Lower quality for initial conversion
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
          setStep("search");
          return;
        }
      }

      // Always compress and resize to ensure file is under 5MB
      console.log("Compressing image...");
      setProcessingStatus("Optimizing image size...");
      try {
        const compressedFile = await resizeAndCompressImage(processedFile, 4.5); // Target 4.5MB to have buffer

        console.log("Compression complete:", {
          originalSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        });

        processedFile = compressedFile;
      } catch (compressionError) {
        console.error("Compression error:", compressionError);
        alert("Failed to process image. Please try a different photo.");
        setStep("search");
        return;
      }

      // Final size check
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (processedFile.size > maxSize) {
        alert(
          `Image is still too large (${(processedFile.size / 1024 / 1024).toFixed(1)}MB). Please use a smaller photo.`,
        );
        setStep("search");
        return;
      }

      console.log("Processed file ready:", {
        name: processedFile.name,
        type: processedFile.type,
        size: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });

      setProcessingStatus("Loading preview...");
      setCapturedImage(processedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        console.log("Image preview created");
        setStep("analyze");
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        alert("Failed to read image file. Please try again.");
        setStep("search");
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Failed to process image. Please try again.");
      setStep("search");
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
      setIngredients(result.analysis.ingredients || []);

      // Mark fields as AI-filled
      setAiFilledFields({
        name: !!result.analysis.name,
        description: !!result.analysis.description,
        category: !!result.analysis.category,
        servingSize: !!result.analysis.portionSize,
        ingredients: result.analysis.ingredients?.length > 0,
        nutrition: false,
      });

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
        ingredients: ingredients,
      });

      setCalories(result.calories);
      setProtein(result.protein);
      setCarbs(result.carbs);
      setFat(result.fat);
      if (result.servingSize) {
        setServingSize(result.servingSize);
      }

      setNutritionData(result);

      // Mark nutrition fields as AI-filled
      setAiFilledFields((prev) => ({
        ...prev,
        nutrition: true,
        servingSize: prev.servingSize || !!result.servingSize,
      }));

      setStep("nutrition");
    } catch (error) {
      console.error("Nutrition fetch failed:", error);
      alert("Failed to get nutrition info. Please enter manually.");
    }
  };

  // Ingredient management
  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  const handleAddIngredient = () => {
    const trimmed = newIngredient.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setNewIngredient("");
    }
  };

  const handleIngredientKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  // Save and log meal
  const handleSaveAndLog = async () => {
    if (!mealName || !calories || !protein || !carbs || !fat) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      console.log("=== Starting meal save and log ===");
      console.log("Current meal data:", {
        mealName,
        calories,
        protein,
        carbs,
        fat,
        servingSize,
        category,
        selectedMeal: selectedMeal?._id,
      });

      // Save to library first (if it's a new meal, not from library)
      let mealId = selectedMeal?._id;

      if (!selectedMeal) {
        console.log("Saving new meal to library...");
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
        console.log("Meal saved to library:", savedMeal);
        mealId = savedMeal._id;
      }

      // Log the meal with current time in ISO format (includes timezone)
      const logData = {
        mealId,
        foodName: mealName,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        servingSize,
        category,
        eatenAt: new Date().toISOString(),
      };
      console.log("Logging meal with data:", logData);

      const logResult = await logMeal.mutateAsync(logData);
      console.log("Meal logged successfully:", logResult);
      console.log("=== Meal save and log complete ===");

      setStep("done");
      setTimeout(() => {
        resetForm();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error("Save failed:", error);
      console.error("Error response:", error.response?.data);
      alert("Failed to log meal. Please try again.");
    }
  };

  // Clear individual AI-filled fields
  const clearField = (fieldName) => {
    switch (fieldName) {
      case "name":
        setMealName("");
        setAiFilledFields((prev) => ({ ...prev, name: false }));
        break;
      case "description":
        setMealDescription("");
        setAiFilledFields((prev) => ({ ...prev, description: false }));
        break;
      case "category":
        setCategory("other");
        setAiFilledFields((prev) => ({ ...prev, category: false }));
        break;
      case "servingSize":
        setServingSize("");
        setAiFilledFields((prev) => ({ ...prev, servingSize: false }));
        break;
      case "ingredients":
        setIngredients([]);
        setAiFilledFields((prev) => ({ ...prev, ingredients: false }));
        break;
      case "nutrition":
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setAiFilledFields((prev) => ({ ...prev, nutrition: false }));
        break;
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
                className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meals..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-navy-800/40 border border-navy-700/30 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-linear-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 hover:border-green-500/50 transition-colors"
              >
                <Camera size={20} className="sm:w-6 sm:h-6 text-green-400" />
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  Take Photo
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-colors"
              >
                <ImageIcon size={20} className="sm:w-6 sm:h-6 text-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  Upload Image
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleManualEntry}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-linear-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
              >
                <Edit3 size={20} className="sm:w-6 sm:h-6 text-purple-400" />
                <span className="text-xs sm:text-sm font-medium text-text-primary">
                  Manual Entry
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
              <div className="space-y-1.5 sm:space-y-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                ) : searchResults?.length > 0 ? (
                  <>
                    <p className="text-[10px] sm:text-xs text-text-secondary px-1">
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
                  <div className="text-center py-6 sm:py-8 text-text-secondary text-xs sm:text-sm">
                    <p>No meals found</p>
                    <p className="text-[10px] sm:text-xs mt-1">
                      Try scanning a photo or manual entry
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 1.5: Processing Image */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8 sm:py-12"
          >
            <motion.div
              className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4 sm:mb-6 bg-navy-800/40 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-primary/20"
              animate={{
                borderColor: [
                  "rgba(56, 189, 248, 0.2)",
                  "rgba(56, 189, 248, 0.5)",
                  "rgba(56, 189, 248, 0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ImageIcon className="text-navy-600" size={48} />
            </motion.div>
            <Loader2
              className="animate-spin text-primary mx-auto mb-3 sm:mb-4"
              size={32}
            />
            <p className="text-text-primary text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
              {processingStatus}
            </p>
            <p className="text-text-secondary text-xs sm:text-sm">
              This may take a few seconds
            </p>
          </motion.div>
        )}

        {/* Step 2: Analyzing (auto-triggered) */}
        {step === "analyze" && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8 sm:py-12"
          >
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Captured meal"
                className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-lg sm:rounded-xl mx-auto mb-4 sm:mb-6 border-2 border-primary/20"
              />
            )}
            <div className="relative inline-block mb-3 sm:mb-4">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
            <p className="text-text-primary text-sm sm:text-base font-medium mb-1.5 sm:mb-2">
              Analyzing your meal with AI...
            </p>
            <p className="text-text-secondary text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
              <Sparkles size={14} className="sm:w-4 sm:h-4" />
              AI is identifying the food
            </p>
            <p className="text-text-secondary text-[10px] sm:text-xs opacity-75 flex items-center justify-center gap-1">
              <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
              Usually takes 2-5 seconds
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
            <div className="flex items-center justify-between mb-3 sm:mb-0">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-1.5 sm:gap-2">
                {aiAnalysis && (
                  <Sparkles
                    size={16}
                    className="sm:w-4.5 sm:h-4.5 text-green-400"
                  />
                )}
                Confirm Details
              </h3>
              <button
                onClick={() => setStep("search")}
                className="p-1.5 sm:p-2 hover:bg-navy-700/50 rounded-lg transition-colors"
              >
                <X
                  size={16}
                  className="sm:w-4.5 sm:h-4.5 text-text-secondary"
                />
              </button>
            </div>

            {/* Image Preview */}
            {(imagePreview || getMealImageUrl(selectedMeal, "preview")) && (
              <div className="relative">
                <img
                  src={imagePreview || getMealImageUrl(selectedMeal, "preview")}
                  alt="Meal"
                  className="w-full h-40 sm:h-48 object-cover rounded-lg sm:rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {/* Meal Name */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="text-[10px] sm:text-xs text-text-secondary">
                  Meal Name *
                </label>
                {aiFilledFields.name && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => clearField("name")}
                    className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] border border-amber-500/20 transition-colors"
                    title="Clear AI suggestion"
                  >
                    <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                    Clear
                  </motion.button>
                )}
              </div>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Grilled Chicken Salad"
                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="text-[10px] sm:text-xs text-text-secondary">
                  Description
                </label>
                {aiFilledFields.description && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => clearField("description")}
                    className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] border border-amber-500/20 transition-colors"
                    title="Clear AI suggestion"
                  >
                    <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                    Clear
                  </motion.button>
                )}
              </div>
              <textarea
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="Additional details about the meal..."
                rows={2}
                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors resize-none"
              />
            </div>

            {/* Category & Serving */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-xs text-text-secondary mb-1 sm:mb-1.5 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base outline-none focus:border-green-500/50 transition-colors"
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
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <label className="text-[10px] sm:text-xs text-text-secondary">
                    Serving Size
                  </label>
                  {aiFilledFields.servingSize && servingSize && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => clearField("servingSize")}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] border border-amber-500/20 transition-colors"
                      title="Clear AI suggestion"
                    >
                      <RotateCcw size={10} />
                    </motion.button>
                  )}
                </div>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="1 plate"
                  className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Ingredients (Editable) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-[10px] sm:text-xs text-text-secondary">
                  Ingredients{" "}
                  {ingredients.length > 0 && `(${ingredients.length})`}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] text-text-secondary/70">
                    Used for nutrition calculation
                  </span>
                  {aiFilledFields.ingredients && ingredients.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => clearField("ingredients")}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] border border-amber-500/20 transition-colors"
                      title="Clear all AI-suggested ingredients"
                    >
                      <RotateCcw size={10} />
                      Clear All
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Ingredient chips */}
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                  {ingredients.map((ingredient, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="group flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                    >
                      <span>{ingredient}</span>
                      <button
                        onClick={() => handleRemoveIngredient(i)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add ingredient input - show button or input field */}
              {!showIngredientInput ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowIngredientInput(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition-colors text-xs sm:text-sm"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                  <span>Add Ingredient</span>
                </motion.button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyPress={handleIngredientKeyPress}
                    placeholder="Add ingredient (e.g., paneer, rice)"
                    autoFocus
                    className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddIngredient}
                    disabled={!newIngredient.trim()}
                    type="button"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowIngredientInput(false);
                      setNewIngredient("");
                    }}
                    type="button"
                    className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              {calories && protein && carbs && fat ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("nutrition")}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-sm sm:text-base font-medium transition-all"
                >
                  Continue
                  <ChevronRight size={16} className="sm:w-4.5 sm:h-4.5" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetNutrition}
                  disabled={!mealName || getNutrition.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-sm sm:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getNutrition.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Getting Nutrition...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="sm:w-4.5 sm:h-4.5" />
                      Get Nutrition
                      <ChevronRight size={16} className="sm:w-4.5 sm:h-4.5" />
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
              <h3 className="text-base sm:text-lg font-semibold text-text-primary flex items-center gap-1.5 sm:gap-2">
                <Sparkles
                  size={16}
                  className="sm:w-4.5 sm:h-4.5 text-green-400"
                />
                Nutrition Info
              </h3>
              <button
                onClick={() => setStep("approve")}
                className="text-text-secondary hover:text-text-primary transition-colors text-xs sm:text-sm flex items-center gap-0.5 sm:gap-1"
              >
                <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                Edit Details
              </button>
            </div>

            {/* Info hint when from library */}
            {selectedMeal && (
              <div className="text-[10px] sm:text-xs text-text-secondary bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 sm:p-3">
                💡 Nutrition from your meal library. Edit values below if
                needed.
              </div>
            )}

            {/* Meal Summary */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-navy-800/40 border border-navy-700/30">
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary text-sm sm:text-base mb-0.5 sm:mb-1">
                    {mealName}
                  </h4>
                  {mealDescription && (
                    <p className="text-xs sm:text-sm text-text-secondary">
                      {mealDescription}
                    </p>
                  )}
                </div>
                {/* Optional: Refresh nutrition button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGetNutrition}
                  disabled={getNutrition.isPending}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-navy-700/50 hover:bg-navy-700 text-[10px] sm:text-xs text-text-secondary hover:text-primary transition-all flex items-center gap-0.5 sm:gap-1 disabled:opacity-50"
                  title="Refresh nutrition with AI"
                >
                  <Sparkles size={10} className="sm:w-3 sm:h-3" />
                  {getNutrition.isPending ? "Updating..." : "Refresh"}
                </motion.button>
              </div>
            </div>

            {/* Macros Grid */}
            <div>
              {aiFilledFields.nutrition &&
                (calories || protein || carbs || fat) && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs text-text-secondary">
                      Nutrition values from AI
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => clearField("nutrition")}
                      className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] border border-amber-500/20 transition-colors"
                      title="Clear all AI nutrition values"
                    >
                      <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                      Clear All
                    </motion.button>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-[10px] sm:text-xs text-text-secondary mb-1 sm:mb-1.5 block">
                    Calories *
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="200"
                    min="0"
                    step="1"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs text-text-secondary mb-1 sm:mb-1.5 block">
                    Protein (g) *
                  </label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="25"
                    min="0"
                    step="0.1"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs text-text-secondary mb-1 sm:mb-1.5 block">
                    Carbs (g) *
                  </label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="30"
                    min="0"
                    step="0.1"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-xs text-text-secondary mb-1 sm:mb-1.5 block">
                    Fat (g) *
                  </label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="10"
                    min="0"
                    step="0.1"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-navy-700/50 border border-navy-600/50 text-text-primary text-sm sm:text-base placeholder:text-text-secondary/50 outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Total Breakdown */}
            {calories && protein && carbs && fat && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-text-secondary">Total Calories:</span>
                  <span className="font-bold text-green-400">
                    {calories} kcal
                  </span>
                </div>
                <div className="mt-1.5 sm:mt-2 flex gap-3 sm:gap-4 text-[10px] sm:text-xs text-text-secondary">
                  <span>P: {protein}g</span>
                  <span>C: {carbs}g</span>
                  <span>F: {fat}g</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("approve")}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-navy-700/50 hover:bg-navy-700 text-text-secondary hover:text-text-primary text-sm sm:text-base font-medium transition-all"
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
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-linear-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white text-sm sm:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logMeal.isPending || saveMeal.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} className="sm:w-4.5 sm:h-4.5" />
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
            className="text-center py-8 sm:py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-3 sm:mb-4"
            >
              <Check size={28} className="sm:w-8 sm:h-8 text-green-400" />
            </motion.div>
            <p className="text-text-primary font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">
              Meal Logged! 🎉
            </p>
            <p className="text-text-secondary text-xs sm:text-sm">
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
  const imageUrl = getMealImageUrl(meal, "thumbnail");

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-navy-800/40 border border-navy-700/30 hover:border-green-500/30 transition-all text-left"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={meal.name}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-navy-700/50 flex items-center justify-center">
          <ImageIcon size={16} className="sm:w-5 sm:h-5 text-text-secondary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm sm:text-base truncate">
          {meal.name}
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-text-secondary mt-0.5 sm:mt-1">
          <span>{meal.calories} cal</span>
          <span>•</span>
          <span>P: {meal.protein}g</span>
          <span>•</span>
          <span>C: {meal.carbs}g</span>
          <span>•</span>
          <span>F: {meal.fat}g</span>
        </div>
        {meal.timesLogged > 0 && (
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">
            <Clock size={10} className="sm:w-3 sm:h-3" />
            <span>Logged {meal.timesLogged}x</span>
          </div>
        )}
      </div>

      <ChevronRight
        size={16}
        className="sm:w-4.5 sm:h-4.5 text-text-secondary shrink-0"
      />
    </motion.button>
  );
}
