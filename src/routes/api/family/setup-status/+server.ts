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
      include: { 
        family: {
          include: {
            users: {
              where: { roles: { has: 'CHILD' } }
            }
          }
        }
      }
    });

    if (!user) {
      return json({ setupComplete: false });
    }

    // Only check setup for parents
    const isParent = user.roles.includes('PARENT');
    if (!isParent) {
      return json({ setupComplete: true }); // Children don't need setup
    }

    // Check if setup is complete:
    // 1. User has a PIN configured
    // 2. Family exists
    // 3. At least one child exists
    const hasPIN = !!user.pinHash;
    const hasFamily = !!user.family;
    const hasChildren = user.family?.users?.length > 0;

    return json({ 
      setupComplete: hasPIN && hasFamily && hasChildren
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}