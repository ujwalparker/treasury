import { json } from '@sveltejs/kit';
import { generateFamilyNames } from '$lib/services/llm';

export async function POST({ request, locals }) {
  try {
    const session = await locals.auth();
    const fullName = session?.user?.name || 'Family';
    
    // Extract surname if available, otherwise use first name
    const nameParts = fullName.split(' ');
    const parentName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
    
    const names = await generateFamilyNames(parentName);
    
    return json({ names });
  } catch (error) {
    console.error('Family names API error:', error);
    
    // Fallback names if LLM fails
    const fallbackNames = [
      'The Family',
      'Family Household',
      'Family Clan'
    ];
    
    return json({ names: fallbackNames });
  }
}