import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const API_KEY = '';

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Fehler: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Antwort:', JSON.stringify(data, null, 2)); // Ausgabe der vollständigen API-Antwort in lesbarem Format

    // Zugriff auf das tatsächliche Textfeld in der Antwort
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponse) {
      console.warn('Unerwartete API-Antwortstruktur oder leere Antwort:', JSON.stringify(data, null, 2));
      return 'Die KI hat keine Antwort gegeben.';
    }

    return aiResponse;
  } catch (error) {
    console.error('Fehler bei der Anfrage an die Gemini API:', error);
    return 'Es ist ein Fehler aufgetreten.';
  }
};

export default generateText;