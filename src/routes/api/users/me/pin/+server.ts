import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function PUT({ request, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const { pin } = await request.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: { pinHash: await bcrypt.hash(pin, 10) }
  });
  
  return json({ success: true });
}
