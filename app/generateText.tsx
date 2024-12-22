import { AI_KEY } from '@env';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const API_KEY = AI_KEY;

export const generateText = async (prompt: string, pageContext: string): Promise<string> => {
  try {
    console.log('Sende Anfrage an Gemini API...');
    const instruction = `
      Hinweis an die KI:
      Du bist ein einfacher und freundlicher Support-Assistent für eine Mensa-App. 
      Antworte immer kurz, klar und freundlich, sodass auch neue Nutzer die App einfach verstehen können. In der App kann der Nutzer nur Mensen und Speisen in Berlin sehen. Abgesehen davon kann die App keine weiteren Funktionen anbieten.
    `;
    const fullPrompt = `${instruction}\n\n${pageContext}\n\n${prompt}`;
    console.log('Gesamter Prompt:', fullPrompt);

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
                text: fullPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fehler bei der API-Anfrage: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Antwort von der API:', data);

    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiResponse || 'Die KI hat keine Antwort gegeben.';
  } catch (error) {
    console.error('Fehler bei der Anfrage an die Gemini API:', error);
    return 'Es ist ein Fehler aufgetreten.';
  }
};
