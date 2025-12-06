import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNoteSummary = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following note content into a single concise sentence (max 20 words) in the same language as the input:\n\n${content}`,
    });
    return response.text || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const suggestTags = async (content: string, availableTags: string[]): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the text below and suggest which tags from the provided list apply. Return ONLY a JSON array of tag names.
      
      Available Tags: ${availableTags.join(', ')}
      
      Text: ${content}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};