import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    if (user.role !== 'PARENT') {
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