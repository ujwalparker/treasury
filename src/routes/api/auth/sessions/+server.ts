import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export async function POST({ request, cookies, locals }) {
  const { email, pin, verify } = await request.json();

  // Verify PIN for current session
  if (verify) {
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

  // Create new PIN session
  if (!email || !pin) {
    return json({ error: 'Email and PIN required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { family: true }
  });

  if (!user?.pinHash || !await bcrypt.compare(pin, user.pinHash)) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET);
  
  cookies.set('pin-session', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      familyId: user.familyId 
    } 
  });
}
