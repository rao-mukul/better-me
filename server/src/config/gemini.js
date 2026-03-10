import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enforced output schema for food image analysis — API guarantees this shape, no parsing failures
const foodAnalysisSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    ingredients: { type: "array", items: { type: "string" } },
    portionSize: { type: "string" },
    category: {
      type: "string",
      enum: ["breakfast", "lunch", "dinner", "snack", "other"],
    },
  },
  required: ["name", "description", "ingredients", "portionSize", "category"],
};

// Enforced output schema for nutrition calculation — API guarantees this shape, no parsing failures
const nutritionSchema = {
  type: "object",
  properties: {
    calories: { type: "integer" },
    protein: { type: "number" },
    carbs: { type: "number" },
    fat: { type: "number" },
    fiber: { type: "number" },
    servingSize: { type: "string" },
  },
  required: ["calories", "protein", "carbs", "fat", "fiber", "servingSize"],
};

// Image analysis model — gemini-3.1-flash-lite-preview (500 RPD free tier)
// Structured JSON output, default temperature for flexible food recognition
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: foodAnalysisSchema,
  },
});

// Nutrition calculation model — temperature 0 for deterministic, consistent calorie/macro values
const geminiNutritionModel = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
  generationConfig: {
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema: nutritionSchema,
  },
});

// Helper function to analyze food image
export async function analyzeFoodImage(imageBase64, mimeType = "image/jpeg") {
  try {
    // Normalize mime type for Gemini compatibility
    let geminiMimeType = mimeType;
    if (mimeType === "image/jpg") {
      geminiMimeType = "image/jpeg";
    } else if (!mimeType.startsWith("image/")) {
      geminiMimeType = "image/jpeg"; // fallback
    }

    const prompt = `Analyze this food image and identify the dish.

CONTEXT:
- User location: Gurugram, Haryana, India
- User is vegetarian (lacto-ovo): eats dairy and eggs, NO meat/poultry/fish
- Prioritize identifying North Indian and regional Indian dishes

MEAL NAME: Short, specific (2-4 words). Examples: "Paneer Tikka", "Dal Tadka", "Egg Curry"

DESCRIPTION: Only what's useful for nutrition calculation. Mention preparation method only if it significantly affects calories (fried vs steamed). Under 10 words. No taste descriptions.

INGREDIENTS: Only nutritionally significant visible ingredients. Use specific names ("paneer" not "cheese", "chickpeas" not "legumes"). No garnishes, no cooking methods, no generic terms like "spices".

PORTION SIZE: Estimate carefully from visual cues (plate size, utensils, hand for scale). Use specific measurements: "150g", "2 medium chapatis", "1 cup rice". For multiple items: "2 rotis + 150g dal + 1 small bowl rice". Be conservative and realistic.

CATEGORY: Classify as breakfast, lunch, dinner, snack, or other.`;

    const result = await geminiModel.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: geminiMimeType,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    // Schema-enforced response — direct parse, no regex needed
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

// Helper function to get nutritional information
export async function getNutritionalInfo(
  foodName,
  description,
  portionSize,
  ingredients = [],
) {
  try {
    const ingredientsList =
      ingredients.length > 0
        ? `\nMain Ingredients: ${ingredients.join(", ")}`
        : "";

    const prompt = `Calculate accurate nutritional values for this VEGETARIAN food.

IMPORTANT CONTEXT:
- User location: Gurugram, Haryana, India
- User is vegetarian (lacto-ovo): eats dairy and eggs, NO meat/poultry/fish
- Use North Indian/regional nutritional databases and typical Indian serving sizes

Food: ${foodName}
Description: ${description}${ingredientsList}
Portion Size: ${portionSize}

STEP-BY-STEP CALCULATION (required for multi-item portions):
If the portion contains multiple items (e.g., "2 rotis + 150g dal + 1 bowl rice"), calculate each component separately then sum:
- Item 1: [name] ([qty/weight]) → X cal, Xg protein, Xg carbs, Xg fat, Xg fiber
- Item 2: [name] ([qty/weight]) → X cal, Xg protein, Xg carbs, Xg fat, Xg fiber
- TOTAL → sum of all items
For single-item portions, calculate directly.

CALCULATION REQUIREMENTS:
1. Use the EXACT portion size provided — do not assume "1 serving"
2. Consider ALL ingredients for accurate macro breakdown
3. Account for cooking method (fried/oil adds ~5g fat per tbsp, steamed doesn't)
4. For Indian dishes, use authentic nutritional data
5. Round protein/carbs/fat/fiber to 1 decimal place, calories to whole number

Confirm or refine the serving size. Use specific measurements: "200g", "2 pieces", "1 cup".`;

    const result = await geminiNutritionModel.generateContent(prompt);
    const response = await result.response;
    // Schema-enforced response — direct parse, no regex needed
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export default geminiModel;
