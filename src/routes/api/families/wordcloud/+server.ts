import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateWordCloud } from '$lib/services/llm';

export async function GET({ url, locals }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parentName = url.searchParams.get('parentName') || session.user.name || 'Parent';
    const themeName = url.searchParams.get('theme') || '';
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (user?.family?.wordCloud) {
      const words = user.family.wordCloud.split(',').map(w => w.trim()).filter(w => w);
      return json({ words });
    }

    const words = await generateWordCloud(parentName, themeName);
    
    return json({ words });
  } catch (error) {
    console.error('Word cloud API error:', error);
    return json({ error: 'Failed to generate word cloud' }, { status: 500 });
  }
}
