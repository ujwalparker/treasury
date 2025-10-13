import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!user) {
      return json({ setupComplete: false });
    }

    const isParent = user.roles.includes('PARENT');
    if (!isParent) {
      return json({ setupComplete: true });
    }

    return json({ 
      setupComplete: user.family?.setupComplete ?? false
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}