import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Image analysis model - default temperature for better creative food recognition
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Stable Gemini 2.5 Flash - supports image analysis
});

// Nutrition calculation model - temperature 0 for deterministic, consistent values
const geminiNutritionModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0, // deterministic output — same food/portion always returns same macros
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

    const prompt = `Analyze this food image and identify the dish and its main nutritional ingredients.

CONTEXT:
- User location: Gurugram, Haryana, India
- User is vegetarian (lacto-ovo) who consumes dairy and eggs but NO meat, poultry, or fish
- Prioritize identifying North Indian and regional Indian dishes

MEAL NAME REQUIREMENTS:
- Keep it SHORT and SPECIFIC (2-4 words max)
- Use common, recognizable names
- Be PRECISE about the dish type
- Examples: "Paneer Tikka", "Veggie Wrap", "Egg Curry", "Dal Tadka"
- Avoid: generic words like "meal", "dish", long descriptive phrases

DESCRIPTION REQUIREMENTS:
- ONLY include information useful for NUTRITION CALCULATION
- List preparation method ONLY if it significantly affects calories (fried vs steamed)
- Mention visible ingredients that contribute to macros
- Keep it under 10 words
- NO taste descriptions, adjectives, or meal timing
- Example: "Fried paneer cubes with bell peppers, onions"

SERVING SIZE ESTIMATION (CRITICAL):
- Carefully analyze the IMAGE to estimate portion size
- Use visual references in the photo (plate size, utensils, hand for scale)
- Provide SPECIFIC measurements: "150g", "2 medium chapatis", "1 cup rice", "200ml smoothie"
- For multiple items, specify each: "2 rotis + 150g dal + 1 small bowl rice"
- Consider typical Indian/vegetarian serving sizes
- Be conservative and realistic based on what you SEE

INGREDIENTS LIST:
- List ONLY nutritionally significant ingredients visible in the image
- Prioritize proteins, grains, vegetables, dairy, legumes
- NO cooking methods, adjectives, or garnishes
- Use specific ingredient names: "paneer" not "cheese", "chickpeas" not "legumes"
- Include eggs if visible
- NEVER suggest meat/fish/poultry

DO NOT INCLUDE:
- Cooking methods as separate items ("grilled", "fried", "baked")
- Adjectives ("spicy", "fresh", "delicious")
- Garnishes ("coriander", "mint leaves") unless substantial
- Generic terms ("spices", "seasonings")
- Meal timing references

Format your response as a JSON object:
{
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese cubes with peppers and onions",
  "ingredients": ["paneer", "bell pepper", "onion", "yogurt", "oil"],
  "portionSize": "200g paneer + 100g vegetables",
  "category": "lunch"
}`;

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
    const text = response.text();

    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse food analysis");
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
- User is vegetarian (lacto-ovo): eats dairy and eggs but NO meat/poultry/fish
- Be PRECISE with calculations based on actual portion sizes
- Use North Indian/regional nutritional databases and typical Indian serving sizes

Food: ${foodName}
Description: ${description}${ingredientsList}
Portion Size: ${portionSize}

CALCULATION REQUIREMENTS:
1. Use the EXACT portion size provided - don't assume "1 serving"
2. Consider ALL ingredients listed for accurate macro breakdown
3. Account for cooking method if mentioned (fried adds fat, steamed doesn't)
4. For Indian dishes, use authentic nutritional data
5. Be realistic about vegetarian protein sources (paneer, dal, eggs, legumes)
6. Round to 1 decimal place for macros, whole numbers for calories

SERVING SIZE REQUIREMENTS:
- Confirm or refine the serving size based on typical portions
- Use specific measurements: "200g", "2 pieces", "1 cup", "1 medium bowl"
- Be consistent with the portion size used in calculations

Provide nutritional information as a JSON object:
{
  "calories": number (whole number),
  "protein": number (in grams, 1 decimal),
  "carbs": number (in grams, 1 decimal),
  "fat": number (in grams, 1 decimal),
  "servingSize": "specific measurement matching the calculation"
}

Be as accurate as possible. This is for health tracking, precision matters.`;

    const result = await geminiNutritionModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse nutritional info");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export default geminiModel;
