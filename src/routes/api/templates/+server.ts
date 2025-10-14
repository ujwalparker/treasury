import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ request }: RequestEvent) {
  try {
    const templates = await prisma.currencyTemplate.findMany({
      include: { models: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { isDefault: 'desc' }
    });

    return json(templates);
  } catch (error) {
    return json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
