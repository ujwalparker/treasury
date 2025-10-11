import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  try {
    const session = await locals.auth();
    
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { currentBalance: true }
    });

    return json({ currentBalance: user?.currentBalance || 0 });
  } catch (error) {
    return json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}