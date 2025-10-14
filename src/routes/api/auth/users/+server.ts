import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ url }) {
  try {
    const email = url.searchParams.get('email');
    
    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { email },
      select: {
        id: true,
        name: true,
        roles: true,
        email: true,
        currentBalance: true
      }
    });

    return json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
