import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ params, locals }) {
  try {
    const session = await locals.auth();
    
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 401 });
    }

    const { userId } = params;
    
    // Users can view their own transactions, parents can view any child's
    let targetUserId = userId;
    if (userId !== user.id && !user.roles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return json(transactions);
  } catch (error) {
    return json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST({ params, locals, request }) {
  try {
    const session = await locals.auth();
    
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 401 });
    }

    const { type, amount, activity, category } = await request.json();
    const { userId } = params;
    
    // Determine target user
    let targetUserId = userId;
    
    // If a parent is creating a transaction for a child
    if (userId !== user.id) {
      if (!user.roles?.includes('PARENT')) {
        return json({ error: 'Permission denied' }, { status: 403 });
      }
      
      const childUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          roles: { has: 'CHILD' }
        }
      });
      
      if (!childUser) {
        return json({ error: 'Invalid child user' }, { status: 400 });
      }
      
      targetUserId = userId;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: targetUserId,
        type,
        amount,
        activity,
        category
      }
    });

    const balanceChange = type === 'CREDIT' || type === 'INTEREST' ? amount : -amount;
    await prisma.user.update({
      where: { id: targetUserId },
      data: { currentBalance: { increment: balanceChange } }
    });

    return json(transaction, { status: 201 });
  } catch (error) {
    return json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
