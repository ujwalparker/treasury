import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Only parents can calculate interest
    if (user.role !== 'PARENT') {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the child user
    const childUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        role: 'CHILD'
      }
    });
    
    if (!childUser) {
      return json({ error: 'Invalid child user' }, { status: 400 });
    }

    // Get current configuration for interest rate
    const config = await prisma.config.findFirst({
      where: { id: 'default-config' }
    });
    
    if (!config) {
      return json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Calculate interest
    const currentBalance = childUser.currentBalance;
    const interestRate = config.interestRate;
    const interestAmount = Math.floor((currentBalance * interestRate) / 100);

    // Create a savings bonus record
    const savingsBonus = await prisma.savingsBonus.create({
      data: {
        userId: childUser.id,
        amount: interestAmount,
        balance: currentBalance
      }
    });

    // Create a transaction for the interest
    const transaction = await prisma.transaction.create({
      data: {
        userId: childUser.id,
        type: 'INTEREST',
        amount: interestAmount,
        activity: 'Weekly Savings Bonus',
        category: 'INTEREST'
      }
    });

    // Update the user's balance
    await prisma.user.update({
      where: { id: childUser.id },
      data: { currentBalance: { increment: interestAmount } }
    });

    return json({
      success: true,
      interestAmount,
      newBalance: childUser.currentBalance + interestAmount,
      transaction
    });
  } catch (error) {
    return json({ error: 'Failed to calculate interest' }, { status: 500 });
  }
}