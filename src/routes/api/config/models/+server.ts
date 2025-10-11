import { json } from '@sveltejs/kit';
import { GROQ_MODELS, GEMINI_MODELS, DEFAULT_GROQ_MODEL, DEFAULT_GEMINI_MODEL } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ locals }: RequestEvent) {
  const session = await locals.auth?.();
  
  if (!session?.user?.roles?.includes('ADMIN')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groqModels = GROQ_MODELS?.split(',').map(m => m.trim()).filter(Boolean) || [];
  const geminiModels = GEMINI_MODELS?.split(',').map(m => m.trim()).filter(Boolean) || [];

  // Add default models if not already in the list
  if (DEFAULT_GROQ_MODEL && !groqModels.includes(DEFAULT_GROQ_MODEL)) {
    groqModels.unshift(DEFAULT_GROQ_MODEL);
  }
  if (DEFAULT_GEMINI_MODEL && !geminiModels.includes(DEFAULT_GEMINI_MODEL)) {
    geminiModels.unshift(DEFAULT_GEMINI_MODEL);
  }

  return json({ 
    groqModels, 
    geminiModels,
    defaultGroqModel: DEFAULT_GROQ_MODEL,
    defaultGeminiModel: DEFAULT_GEMINI_MODEL
  });
}
