import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      family: {
        include: { users: true }
      }
    }
  });

  return json({ user, family: user?.family });
}

export async function POST({ request, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const { name, theme, interests } = await request.json();

  const existingUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { family: true }
  });
  
  let family;
  if (existingUser?.family) {
    family = await prisma.family.update({
      where: { id: existingUser.familyId },
      data: { name, theme: theme?.id, interests: interests || [] }
    });
  } else {
    family = await prisma.family.create({
      data: { 
        name,
        theme: theme?.id,
        interests: interests || [],
        config: {
          create: {
            rupeeCoinValue: 10,
            twoRupeeCoinValue: 20,
            paisa50Value: 5,
            paisa25Value: 2,
            interestRate: 10,
            startingCapital: 480
          }
        }
      }
    });
  }
  
  await prisma.user.update({
    where: { email: session.user.email },
    data: { familyId: family.id, roles: ['PARENT', 'ADMIN'] }
  });
  
  return json({ family }, { status: 201 });
}
