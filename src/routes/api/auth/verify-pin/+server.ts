import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function POST({ request, locals, cookies }) {
  const { pin } = await request.json();
  
  // Get current user from Auth.js session
  const session = await locals.auth();
  if (!session?.user?.email) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!user?.pinHash || !await bcrypt.compare(pin, user.pinHash)) {
    return json({ error: 'Invalid PIN' }, { status: 401 });
  }
  
  return json({ success: true });
}