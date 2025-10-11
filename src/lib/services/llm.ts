import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GROQ_API_KEY, GEMINI_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/prisma';

interface LLMConfig {
  provider: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  groqModel: string;
  geminiModel: string;
}

async function getLLMConfig(): Promise<LLMConfig & {verificationKeywords?: string}> {
  const defaultGroqModel = env.GROQ_MODELS?.split(',')[0] || 'llama3-8b-8192';
  const defaultGeminiModel = env.GEMINI_MODELS?.split(',')[0] || 'gemini-pro';
  
  try {
    const config = await prisma.adminConfig.findFirst();
    return {
      provider: config?.defaultLlmProvider || 'groq',
      groqApiKey: config?.groqApiKey || GROQ_API_KEY,
      geminiApiKey: config?.geminiApiKey || GEMINI_API_KEY,
      groqModel: config?.groqModel || defaultGroqModel,
      geminiModel: config?.geminiModel || defaultGeminiModel,
      verificationKeywords: config?.verificationKeywords
    };
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return {
      provider: 'groq',
      groqApiKey: GROQ_API_KEY,
      geminiApiKey: GEMINI_API_KEY,
      groqModel: defaultGroqModel,
      geminiModel: defaultGeminiModel
    };
  }
}

async function generateWithGroq(prompt: string, config: LLMConfig): Promise<any> {
  if (!config.groqApiKey) throw new Error('Groq API key not configured');
  
  const groq = new Groq({ apiKey: config.groqApiKey });
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: config.groqModel,
    temperature: 0.8,
    max_tokens: 200,
    top_p: 0.9
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('No content generated');
  
  // Clean content to extract JSON
  const jsonMatch = content.match(/\[.*\]/s);
  if (!jsonMatch) throw new Error('No valid JSON found in response');
  
  return JSON.parse(jsonMatch[0]);
}

async function generateWithGemini(prompt: string, config: LLMConfig): Promise<any> {
  if (!config.geminiApiKey) throw new Error('Gemini API key not configured');
  
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: config.geminiModel });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text().trim();
  
  if (!content) throw new Error('No content generated');
  
  // Clean content to extract JSON
  const jsonMatch = content.match(/\[.*\]/s);
  if (!jsonMatch) throw new Error('No valid JSON found in response');
  
  return JSON.parse(jsonMatch[0]);
}

export async function generateFamilyNames(parentName: string): Promise<string[]> {
  const config = await getLLMConfig();
  
  const prompt = `Generate exactly 4 creative family names based on the parent name "${parentName}".
  
  The names should be:
  - Family-friendly and appropriate
  - Creative variations using the parent's name
  - Sound like real family names
  - Include different formats (Family, Household, Clan, etc.)
  
  Return ONLY a JSON array of 4 family names, no other text.
  Example: ["The Johnson Family", "Johnson Household", "The Johnson Clan", "Johnson & Co."]`;

  try {
    if (config.provider === 'gemini') {
      return await generateWithGemini(prompt, config);
    } else {
      return await generateWithGroq(prompt, config);
    }
  } catch (error) {
    console.error(`Family names generation error with ${config.provider}:`, error);
    // Fallback names if both APIs fail
    return [
      `The ${parentName} Family`,
      `${parentName} Household`,
      `${parentName} Clan`,
      `${parentName} & Co.`
    ];
  }
}

export async function generateWordCloud(parentName: string, themeName: string): Promise<string[]> {
  const timestamp = Date.now();
  const timeContext = new Date().toLocaleString();
  const config = await getLLMConfig();
  
  const prompt = `Generate exactly 10 unique, positive family-oriented words for a digital banking app called Treasury. 
  
  Context:
  - Parent name: ${parentName}
  - Family theme: ${themeName}
  - Time context: ${timeContext}
  - Timestamp: ${timestamp}
  
  The words should be:
  - Related to family values, financial responsibility, or the ${themeName} theme
  - Appropriate for children
  - Inspiring and motivational
  - Unique based on the parent name and time
  
  Return ONLY a JSON array of 10 words, no other text.
  Example: ["savings", "growth", "responsibility", "teamwork", "goals", "achievement", "trust", "learning", "progress", "success"]`;

  try {
    if (config.provider === 'gemini') {
      return await generateWithGemini(prompt, config);
    } else {
      return await generateWithGroq(prompt, config);
    }
  } catch (error) {
    console.error(`Word cloud generation error with ${config.provider}:`, error);
    // Fallback words if both APIs fail
    return [
      "savings", "growth", "responsibility", "teamwork", "goals", 
      "achievement", "trust", "learning", "progress", "success"
    ];
  }
}

export async function generateVerificationQuestions(): Promise<Array<{question: string, options: string[], correctIndex: number}>> {
  const config = await getLLMConfig();
  const keywords = config.verificationKeywords || "legal drinking age in indian, indian tax filing";
  
  const prompt = `Generate exactly 6 multiple choice verification questions that only adults/parents would know. Each question should have 3 options with numeric answers. Include 1 correct answer and 2 plausible wrong answers.

Base questions on these topics: ${keywords}

Questions should be about adult knowledge that children typically wouldn't know.

Return ONLY a JSON array with objects containing "question", "options" (array of 3 strings), and "correctIndex" (0, 1, or 2).

Example format:
[{
  "question": "What is the legal drinking age in India?",
  "options": ["18", "19", "20"],
  "correctIndex": 0
}]`;

  try {
    if (config.provider === 'gemini') {
      const result = await generateWithGemini(prompt, config);
      return result as Array<{question: string, options: string[], correctIndex: number}>;
    } else {
      const result = await generateWithGroq(prompt, config);
      return result as Array<{question: string, options: string[], correctIndex: number}>;
    }
  } catch (error) {
    console.error(`Question generation error with ${config.provider}:`, error);
    // Fallback questions
    return [
      { question: "What is the legal drinking age in the United States?", options: ["18", "19", "20", "21", "25"], correctIndex: 3 },
      { question: "What is the typical mortgage term in years?", options: ["10", "15", "20", "25", "30"], correctIndex: 4 },
      { question: "At what age can you collect full Social Security benefits?", options: ["62", "65", "67", "70", "72"], correctIndex: 2 },
      { question: "What is considered a good credit score?", options: ["500", "600", "700", "800", "900"], correctIndex: 2 },
      { question: "When is the tax filing deadline in the US?", options: ["March 15", "April 15", "May 15", "June 15", "July 15"], correctIndex: 1 },
      { question: "What is the minimum age to rent a car in most US states?", options: ["18", "21", "23", "25", "30"], correctIndex: 3 }
    ];
  }
}