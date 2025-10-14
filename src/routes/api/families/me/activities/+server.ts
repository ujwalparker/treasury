import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  try {
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.roles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const activities = await prisma.activity.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return json(activities);
  } catch (error) {
    return json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
