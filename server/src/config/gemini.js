import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enforced output schema for food image analysis — API guarantees this shape, no parsing failures
const foodAnalysisSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    portionSize: { type: "string" },
  },
  required: ["name", "description", "portionSize"],
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

DESCRIPTION: Brief visual description under 10 words. Mention preparation style only if clearly visible.

PORTION SIZE: Estimate carefully from visual cues (plate size, utensils, hand for scale). Use specific measurements: "150g", "2 medium chapatis", "1 cup rice". For multiple items: "2 rotis + 150g dal + 1 small bowl rice". Be conservative and realistic.
`;

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

export default geminiModel;
