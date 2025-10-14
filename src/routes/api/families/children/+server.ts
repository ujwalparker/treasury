import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function GET({ locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user?.familyId) return json({ error: 'No family found' }, { status: 400 });

  const children = await prisma.user.findMany({
    where: { 
      familyId: user.familyId,
      roles: { has: 'CHILD' }
    },
    select: {
      id: true,
      name: true,
      email: true,
      currentBalance: true,
      yearOfBirth: true
    }
  });

  return json(children);
}

export async function POST({ request, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const parent = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!parent?.familyId) return json({ error: 'No family found' }, { status: 400 });

  const { name, email, pin, yearOfBirth } = await request.json();

  const familyConfig = await prisma.familyConfig.findUnique({
    where: { familyId: parent.familyId }
  });
  
  const child = await prisma.user.create({
    data: {
      name,
      email: email || `child-${Date.now()}-${Math.random().toString(36).substring(7)}@treasury.local`,
      roles: ['CHILD'],
      familyId: parent.familyId,
      parentId: parent.id,
      pinHash: await bcrypt.hash(pin, 10),
      currentBalance: familyConfig?.startingCapital || 480,
      yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : undefined
    }
  });
  
  return json({ child }, { status: 201 });
}

export async function PATCH({ request, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const parent = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!parent?.familyId) return json({ error: 'No family found' }, { status: 400 });

  const { children } = await request.json();

  for (const child of children) {
    if (child.id && child.yearOfBirth) {
      await prisma.user.update({
        where: { id: child.id },
        data: { yearOfBirth: parseInt(child.yearOfBirth) }
      });
    }
  }
  
  return json({ success: true, updated: children.length });
}
