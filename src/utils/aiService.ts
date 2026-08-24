import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = (): string => {
  return (
    import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
};

export async function summarizeDocument(text: string): Promise<string[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Google GenAI API Key is missing. Please add VITE_GOOGLE_GENAI_API_KEY to your .env file.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const prompt = `Summarize the following document into 4 to 6 concise, insightful key bullet points. Do not include introductory text or markdown titles, only return bullet points separated by newlines:\n\n${text.slice(0, 15000)}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const points = responseText
      .split('\n')
      .map((line) => line.replace(/^[\s•*-]+/, '').trim())
      .filter((line) => line.length > 5);
    return points.length > 0 ? points : [responseText.trim()];
  } catch (err: any) {
    console.error('GenAI Summarization Error:', err);
    throw new Error(err.message || 'AI Summarization failed.');
  }
}

export async function processAiTask(
  text: string,
  task: 'summarize' | 'translate' | 'rephrase' | 'fix_grammar',
  targetLang?: string
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'Google GenAI API Key is missing. Please add VITE_GOOGLE_GENAI_API_KEY to your .env file.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  let prompt = '';
  switch (task) {
    case 'summarize':
      prompt = `Provide a concise, professional summary of the following text:\n\n${text.slice(0, 10000)}`;
      break;
    case 'translate':
      prompt = `Translate the following text into ${targetLang || 'English'}. Return only the translated text:\n\n${text.slice(0, 10000)}`;
      break;
    case 'rephrase':
      prompt = `Rephrase and polish the following text for better readability and tone. Return only the revised text:\n\n${text.slice(0, 10000)}`;
      break;
    case 'fix_grammar':
      prompt = `Fix all spelling, punctuation, and grammar mistakes in the following text. Return only the corrected text:\n\n${text.slice(0, 10000)}`;
      break;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err: any) {
    console.error('GenAI Task Error:', err);
    throw new Error(err.message || 'AI processing failed.');
  }
}
