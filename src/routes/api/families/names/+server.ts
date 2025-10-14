import { json } from '@sveltejs/kit';
import { generateFamilyNames } from '$lib/services/llm';

export async function GET({ url, locals }) {
  try {
    const session = await locals.auth();
    const fullName = session?.user?.name || 'Family';
    
    const tags = url.searchParams.get('tags')?.split(',').map(t => t.trim()).filter(Boolean) || [];
    const theme = url.searchParams.get('theme') || '';
    
    const nameParts = fullName.split(' ');
    const parentName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
    
    const names = await generateFamilyNames(parentName, tags, theme);
    
    return json({ names });
  } catch (error) {
    console.error('Family names API error:', error);
    
    const fallbackNames = [
      'The Family',
      'Family Household',
      'Family Clan'
    ];
    
    return json({ names: fallbackNames });
  }
}
