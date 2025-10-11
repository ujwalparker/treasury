import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Find all users associated with this email
    const users = await prisma.user.findMany({
      where: { email },
      select: {
        id: true,
        name: true,
        role: true,
        currentBalance: true
      }
    });

    return json(users);
  } catch (error) {
    console.error('Error fetching social users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}