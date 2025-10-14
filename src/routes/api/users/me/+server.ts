import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

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
}
