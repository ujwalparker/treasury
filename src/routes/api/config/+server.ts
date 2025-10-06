import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ request }) {
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

    // Only parents can access configuration
    if (user.role !== 'PARENT') {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const config = await prisma.config.findFirst({
      where: { id: 'default-config' }
    }) || await prisma.config.create({
      data: {
        id: 'default-config',
        rupeeCoinValue: 10,
        twoRupeeCoinValue: 20,
        paisa50Value: 5,
        paisa25Value: 2,
        interestRate: 10,
        startingCapital: 480,
      }
    });

    return json(config);
  } catch (error) {
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT({ request }) {
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

    // Only parents can update configuration
    if (user.role !== 'PARENT') {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { 
      rupeeCoinValue,
      twoRupeeCoinValue,
      paisa50Value,
      paisa25Value,
      interestRate,
      startingCapital
    } = await request.json();

    // Validate values
    if (rupeeCoinValue < 0 || twoRupeeCoinValue < 0 || paisa50Value < 0 || 
        paisa25Value < 0 || interestRate < 0 || startingCapital < 0) {
      return json({ error: 'All values must be positive numbers' }, { status: 400 });
    }

    const updatedConfig = await prisma.config.upsert({
      where: { id: 'default-config' },
      update: {
        rupeeCoinValue,
        twoRupeeCoinValue,
        paisa50Value,
        paisa25Value,
        interestRate,
        startingCapital
      },
      create: {
        id: 'default-config',
        rupeeCoinValue,
        twoRupeeCoinValue,
        paisa50Value,
        paisa25Value,
        interestRate,
        startingCapital
      }
    });

    return json(updatedConfig);
  } catch (error) {
    return json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}