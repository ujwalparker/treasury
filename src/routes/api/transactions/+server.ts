import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ request, url }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    // For parent users, allow fetching any child's transactions
    const userId = url.searchParams.get('userId');
    let whereClause = {};
    
    if (user.role === 'PARENT' && userId) {
      // Parent can view any child's transactions
      whereClause = { userId };
    } else {
      // Users can only view their own transactions
      whereClause = { userId: user.id };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return json(transactions);
  } catch (error) {
    return json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    
    if (!user) {
      return json({ error: 'Invalid token' }, { status: 401 });
    }

    const { type, amount, activity, category, userId } = await request.json();
    
    // Determine which user ID to use for the transaction
    let targetUserId = user.id;
    
    // If a parent is creating a transaction for a child
    if (user.role === 'PARENT' && userId) {
      // Verify the userId belongs to a child user
      const childUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          role: 'CHILD'
        }
      });
      
      if (!childUser) {
        return json({ error: 'Invalid child user' }, { status: 400 });
      }
      
      targetUserId = userId;
    } else if (userId && user.role !== 'PARENT') {
      // Non-parents cannot create transactions for others
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: targetUserId,
        type,
        amount,
        activity,
        category
      }
    });

    // Update the user's balance
    const balanceChange = type === 'CREDIT' || type === 'INTEREST' ? amount : -amount;
    await prisma.user.update({
      where: { id: targetUserId },
      data: { currentBalance: { increment: balanceChange } }
    });

    return json(transaction);
  } catch (error) {
    return json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}