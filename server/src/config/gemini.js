import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Using flash for speed and cost-effectiveness
});

// Helper function to analyze food image
export async function analyzeFoodImage(imageBase64) {
  try {
    const prompt = `Analyze this food image and provide a detailed description of the meal. Include:
1. Name of the dish/food
2. Main ingredients you can identify
3. Estimated portion size
4. Meal type (breakfast/lunch/dinner/snack)
5. Any notable characteristics

Format your response as a JSON object with these fields:
{
  "name": "dish name",
  "description": "detailed description",
  "ingredients": ["ingredient1", "ingredient2"],
  "portionSize": "estimated size",
  "category": "breakfast/lunch/dinner/snack",
  "tags": ["tag1", "tag2"]
}`;

    const result = await geminiModel.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
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
export async function getNutritionalInfo(foodName, description, portionSize) {
  try {
    const prompt = `Based on this food information, provide accurate nutritional values:
Food: ${foodName}
Description: ${description}
Portion Size: ${portionSize}

Provide nutritional information as a JSON object:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams),
  "servingSize": "description of serving size"
}

Be as accurate as possible based on standard nutritional databases.`;

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
