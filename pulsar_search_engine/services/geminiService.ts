import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function initGeminiService(apiKey: string) {
    if (!apiKey || apiKey.includes("YOUR_API_KEY")) {
        console.warn("Gemini API key is not configured or is a placeholder. Gemini features will be unavailable.");
        ai = null;
        return;
    }
    ai = new GoogleGenAI({ apiKey });
}


export const askGemini = async (prompt: string): Promise<string> => {
  if (!prompt) {
    return "Please provide a prompt.";
  }
  
  if(!ai) {
    return "API Key is not configured. Please add it to metadata.json and reload the application.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Disable thinking for faster, more conversational responses suitable for a voice assistant.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Sorry, I ran into an error: ${error.message}`;
    }
    return "An unknown error occurred while contacting the Gemini API.";
  }
};