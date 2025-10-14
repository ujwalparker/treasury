import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ locals }) {
  try {
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.roles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!user.familyId) {
      return json({ error: 'No family associated' }, { status: 400 });
    }

    const config = await prisma.familyConfig.findUnique({
      where: { familyId: user.familyId },
      include: { currencyModels: { orderBy: { sortOrder: 'asc' } } }
    });

    if (!config) {
      return json({ interestRate: 10, currencyModels: [] });
    }

    return json(config);
  } catch (error) {
    return json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT({ request, locals }) {
  try {
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.roles?.includes('PARENT')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!user.familyId) {
      return json({ error: 'No family associated' }, { status: 400 });
    }

    const { interestRate, currencyModels, currencyTemplateId } = await request.json();

    if (interestRate < 0) {
      return json({ error: 'Interest rate must be positive' }, { status: 400 });
    }

    if (currencyTemplateId) {
      await prisma.family.update({
        where: { id: user.familyId },
        data: { currencyTemplateId }
      });
    }

    const config = await prisma.familyConfig.upsert({
      where: { familyId: user.familyId },
      update: { interestRate },
      create: { familyId: user.familyId, interestRate }
    });

    if (currencyModels) {
      await prisma.currencyModel.deleteMany({ where: { configId: config.id } });
      await prisma.currencyModel.createMany({
        data: currencyModels.map((cm: any, idx: number) => ({
          configId: config.id,
          name: cm.name,
          type: cm.type,
          value: cm.value,
          sortOrder: cm.sortOrder ?? idx
        }))
      });
    }

    await prisma.family.update({
      where: { id: user.familyId },
      data: { setupComplete: true }
    });

    const updatedConfig = await prisma.familyConfig.findUnique({
      where: { id: config.id },
      include: { currencyModels: { orderBy: { sortOrder: 'asc' } } }
    });

    return json(updatedConfig);
  } catch (error) {
    return json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
