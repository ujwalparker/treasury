import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function DELETE({ params, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const parent = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!parent?.familyId) return json({ error: 'No family found' }, { status: 400 });

  const child = await prisma.user.findUnique({
    where: { id: params.childId }
  });

  if (!child || child.familyId !== parent.familyId) {
    return json({ error: 'Child not found' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: params.childId },
    data: { pinHash: null }
  });
  
  return json({ success: true });
}
