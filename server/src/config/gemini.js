import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model - using gemini-2.5-flash (stable, fast, multimodal with vision)
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Stable Gemini 2.5 Flash - supports image analysis
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

IMPORTANT: List ONLY the actual food ingredients that contribute to nutritional value. 
Do NOT include:
- Cooking methods ("grilled", "fried", "baked")
- Adjectives ("spicy", "delicious", "fresh") 
- Meal types ("breakfast", "lunch", "dinner")
- Serving descriptions ("plated", "served")

DO include:
- Main proteins (chicken, fish, eggs, paneer, tofu)
- Grains & starches (rice, bread, pasta, potato)
- Vegetables (specific ones: tomato, spinach, broccoli)
- Dairy (milk, cheese, yogurt, butter)
- Legumes (lentils, chickpeas, beans)
- Fats/oils (oil, ghee, nuts)
- Major spices/sauces if significant (curry, soy sauce)

Format your response as a JSON object:
{
  "name": "dish name",
  "description": "brief description",
  "ingredients": ["chicken", "rice", "onion", "tomato", "oil"],
  "portionSize": "estimated size",
  "category": "breakfast/lunch/dinner/snack"
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

    const prompt = `Based on this food information, provide accurate nutritional values:
Food: ${foodName}
Description: ${description}${ingredientsList}
Portion Size: ${portionSize}

Provide nutritional information as a JSON object:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams),
  "servingSize": "description of serving size"
}

Be as accurate as possible based on standard nutritional databases. Consider the specific ingredients listed if provided.`;

    const result = await geminiModel.generateContent(prompt);
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
