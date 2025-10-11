import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ locals }: RequestEvent) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        currentBalance: true,
        familyId: true
      }
    });

    return json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}