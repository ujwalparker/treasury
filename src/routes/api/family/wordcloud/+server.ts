import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateWordCloud } from '$lib/services/llm';

export async function POST({ request, locals }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { parentName, themeName } = await request.json();
    
    // Check if user already has a family with word cloud
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (user?.family?.wordCloud) {
      // Return existing word cloud (convert comma-separated string to array)
      const words = user.family.wordCloud.split(',').map(w => w.trim()).filter(w => w);
      return json({ words });
    }

    // Generate new word cloud
    const words = await generateWordCloud(parentName, themeName);
    
    return json({ words });
  } catch (error) {
    console.error('Word cloud API error:', error);
    return json({ error: 'Failed to generate word cloud' }, { status: 500 });
  }
}