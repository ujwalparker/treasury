import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

const DEFAULT_CONFIG = {
  rupeeCoinValue: 10,
  twoRupeeCoinValue: 20,
  paisa50Value: 5,
  paisa25Value: 2,
  interestRate: 10
};

export async function GET({ request, locals }: RequestEvent) {
  try {
    // Try Auth.js session first
    const session = await locals.auth?.();
    let userEmail = session?.user?.email;
    let userRoles = session?.user?.roles;
    let familyId = session?.user?.familyId;

    // Fallback to JWT token
    if (!userEmail) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const user = await verifyToken(token);
      
      if (!user) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
      userRoles = [user.role];
      familyId = user.familyId;
    }

    // Only PARENT can access family configuration
    if (!userRoles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!familyId) {
      return json({ error: 'No family associated' }, { status: 400 });
    }

    const config = await prisma.familyConfig.findUnique({
      where: { familyId }
    });

    return json(config || DEFAULT_CONFIG);
  } catch (error) {
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT({ request, locals }: RequestEvent) {
  try {
    // Try Auth.js session first
    const session = await locals.auth?.();
    let userEmail = session?.user?.email;
    let userRoles = session?.user?.roles;
    let familyId = session?.user?.familyId;

    // Fallback to JWT token
    if (!userEmail) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const user = await verifyToken(token);
      
      if (!user) {
        return json({ error: 'Invalid token' }, { status: 401 });
      }
      userRoles = [user.role];
      familyId = user.familyId;
    }

    // Only PARENT can update family configuration
    if (!userRoles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!familyId) {
      return json({ error: 'No family associated' }, { status: 400 });
    }

    const { 
      rupeeCoinValue,
      twoRupeeCoinValue,
      paisa50Value,
      paisa25Value,
      interestRate
    } = await request.json();

    // Validate values
    if (rupeeCoinValue < 0 || twoRupeeCoinValue < 0 || paisa50Value < 0 || 
        paisa25Value < 0 || interestRate < 0) {
      return json({ error: 'All values must be positive numbers' }, { status: 400 });
    }

    const updateData = {
      rupeeCoinValue,
      twoRupeeCoinValue,
      paisa50Value,
      paisa25Value,
      interestRate
    };

    const updatedConfig = await prisma.familyConfig.upsert({
      where: { familyId },
      update: updateData,
      create: { familyId, ...updateData }
    });

    // Mark family setup as complete
    await prisma.family.update({
      where: { id: familyId },
      data: { setupComplete: true }
    });

    return json(updatedConfig);
  } catch (error) {
    return json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}