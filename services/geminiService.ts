// This service now communicates with our secure backend (api/ai.ts)
// The API Key is no longer needed here, ensuring security.

const API_ENDPOINT = '/api/ai';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const generateNoteSummary = async (content: string): Promise<string> => {
  try {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type: 'summary', content })
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data.result || "";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "";
  }
};

export const suggestTags = async (content: string, availableTags: string[]): Promise<string[]> => {
  try {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type: 'suggestTags', content, availableTags })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("AI Tags Error:", error);
    return [];
  }
};