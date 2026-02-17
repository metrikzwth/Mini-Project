/**
 * Gemini AI Service for MediCare Chatbot
 *
 * HOW TO SET UP:
 * 1. Go to https://aistudio.google.com/app/apikey
 * 2. Click "Create API Key" → select a project → copy the key
 * 3. Open your .env.local file and add:
 *      VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
 * 4. Restart the dev server (npm run dev)
 *
 * The chatbot will automatically use Gemini when the key is present.
 * If the key is missing, it falls back to keyword-based responses.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `You are MediCare AI, a helpful and friendly medical assistant chatbot for an online pharmacy platform. Your role is to help patients with medicine-related questions.

You can help with:
- When to take a medicine (before/after food, morning/night)
- What to drink/avoid with medications
- Common side effects and precautions
- Dosage timing and general guidance
- Drug interactions (general awareness)
- General wellness tips related to medications

Rules you MUST follow:
1. ALWAYS include a disclaimer that users should consult their doctor for personalized medical advice.
2. NEVER diagnose conditions or prescribe specific medications.
3. Keep responses concise but informative (under 200 words).
4. Use bullet points and emojis for readability.
5. If asked about something outside medicine/health, politely redirect to medical topics.
6. Be warm, empathetic, and professional.
7. Format responses with markdown-style formatting (bold with **, bullet points with •).`;

export interface GeminiResponse {
    text: string;
    error?: string;
}

export function isGeminiConfigured(): boolean {
    return GEMINI_API_KEY.length > 0 && GEMINI_API_KEY !== "YOUR_API_KEY_HERE";
}

export async function askGemini(
    userMessage: string,
    conversationHistory: { role: "user" | "model"; text: string }[] = []
): Promise<GeminiResponse> {
    if (!isGeminiConfigured()) {
        return { text: "", error: "API key not configured" };
    }

    try {
        // Build contents array with conversation history
        const contents = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT + "\n\nUser's first message follows." }],
            },
            {
                role: "model",
                parts: [{ text: "Understood! I'm MediCare AI, ready to help with medicine-related questions. I'll be helpful, concise, and always remind users to consult their doctor. How can I help?" }],
            },
            ...conversationHistory.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.text }],
            })),
            {
                role: "user",
                parts: [{ text: userMessage }],
            },
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 512,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API error:", errData);
            return {
                text: "",
                error: `API error ${response.status}: ${errData?.error?.message || "Unknown error"}`,
            };
        }

        const data = await response.json();
        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I couldn't generate a response. Please try again.";

        return { text };
    } catch (err: any) {
        console.error("Gemini fetch error:", err);
        return { text: "", error: err.message || "Network error" };
    }
}
