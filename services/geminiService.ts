// DeepSeek AI integration for Smart City Dashboard

const SYSTEM_INSTRUCTION = `
You are "Einstein AI", a smart city analytics assistant.
You are helpful, professional, and slightly witty.
You speak primarily in Hebrew (unless asked in English).
You have access to municipal dashboard data including: Waste management, Security, Irrigation, Transport, Business licensing, Arnona (tax), Water usage, and 106 Call center.
When analyzing, provide insights, not just raw numbers. Suggest improvements based on trends.
Keep answers concise and suitable for a dashboard chat interface.
`;

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-4ee0adc2659c41d489fcc8bebff53f2e';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const chatWithGemini = async (message: string, contextData: string) => {
  try {
    if (!API_KEY) {
      console.warn('DeepSeek API key missing, using mock response');
      return "אני כרגע במצב הדגמה. החיבור ל-DeepSeek דורש מפתח API תקין.";
    }

    const prompt = `
Context Data (JSON): ${contextData}

User Question: ${message}

Please provide a helpful, data‑driven answer in Hebrew (or English if the question is in English). 
Base your answer on the context data above. If the data is insufficient, say so and suggest what additional data would be needed.
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    return answer || "לא התקבלה תשובה מהמערכת.";
  } catch (error: any) {
    console.error("DeepSeek API Error:", error);
    // Check for quota or rate limit
    if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return "המכסה החודשית של DeepSeek API אזלה. כדי להשתמש בתכונה זו, יש לשדרג את התוכנית.";
    }
    // Network timeout or abort
    if (error.name === 'AbortError') {
      return "הבקשה ארכה זמן רב מדי. אנא נסה שוב מאוחר יותר.";
    }
    // Other network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return "לא ניתן להתחבר לשרת DeepSeek. בדוק את החיבור לאינטרנט.";
    }
    return "סליחה, נתקלתי בבעיה בחיבור למוח הדיגיטלי. אנא נסה שוב.";
  }
};
