import { Groq } from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';

const groq = new Groq({ apiKey: GROQ_API_KEY });

export async function generateWordCloud(parentName: string, themeName: string): Promise<string[]> {
  const timestamp = Date.now();
  const timeContext = new Date().toLocaleString();
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate exactly 10 unique, positive family-oriented words for a digital banking app called Treasury. 
          
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
          Example: ["savings", "growth", "responsibility", "teamwork", "goals", "achievement", "trust", "learning", "progress", "success"]`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.8,
      max_tokens: 200,
      top_p: 0.9
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('No content generated');
    
    const words = JSON.parse(content);
    if (!Array.isArray(words) || words.length !== 10) {
      throw new Error('Invalid word cloud format');
    }
    
    return words;
  } catch (error) {
    console.error('Word cloud generation error:', error);
    // Fallback words if API fails
    return [
      "savings", "growth", "responsibility", "teamwork", "goals", 
      "achievement", "trust", "learning", "progress", "success"
    ];
  }
}