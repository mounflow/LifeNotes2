import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("AI Handler invoked", { method: req.method, bodyType: req.body?.type });

  // 1. Security: Verify User Token
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, JWT_SECRET);
  } catch (e) {
      console.error("Token verification failed", e);
      return res.status(401).json({ message: 'Invalid token' });
  }

  // 2. Safety Check: Ensure API Key exists
  if (!process.env.API_KEY) {
      console.error("Missing Gemini API Key configuration");
      return res.status(500).json({ message: 'Server configuration error: AI service not available' });
  }

  if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
  }

  // Initialize AI client per request to ensure environment variables are loaded
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { type, content, availableTags } = req.body;

  try {
    // 3. Handle Summary Generation
    if (type === 'summary') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following note content into a single concise sentence (max 20 words) in the same language as the input:\n\n${content}`,
        });
        return res.status(200).json({ result: response.text || '' });
    } 
    
    // 4. Handle Tag Suggestion
    else if (type === 'suggestTags') {
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
        const tags = text ? JSON.parse(text) : [];
        return res.status(200).json({ result: tags });
    }

    return res.status(400).json({ message: 'Invalid action type' });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ message: 'AI Service Error' });
  }
}