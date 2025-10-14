import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ request, locals }: RequestEvent) {
  try {
    const session = await locals.auth?.();
    let userRoles = session?.user?.roles;

    if (!session?.user?.email) {
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
    }

    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const templates = await prisma.currencyTemplate.findMany({
      include: { models: { orderBy: { sortOrder: 'asc' } } }
    });

    return json(templates);
  } catch (error) {
    return json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST({ request, locals }: RequestEvent) {
  try {
    const session = await locals.auth?.();
    let userRoles = session?.user?.roles;

    if (!session?.user?.email) {
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
    }

    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { name, code, isDefault, models } = await request.json();

    if (isDefault) {
      await prisma.currencyTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const adminConfig = await prisma.adminConfig.findFirst() || await prisma.adminConfig.create({ data: {} });

    const template = await prisma.currencyTemplate.create({
      data: {
        name,
        code,
        isDefault,
        adminConfigId: adminConfig.id,
        models: {
          create: models.map((m: any, idx: number) => ({
            name: m.name,
            type: m.type,
            value: m.value,
            sortOrder: m.sortOrder ?? idx
          }))
        }
      },
      include: { models: true }
    });

    return json(template);
  } catch (error) {
    return json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function PUT({ request, locals }: RequestEvent) {
  try {
    const session = await locals.auth?.();
    let userRoles = session?.user?.roles;

    if (!session?.user?.email) {
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
    }

    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id, name, code, isDefault, models } = await request.json();

    if (isDefault) {
      await prisma.currencyTemplate.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false }
      });
    }

    await prisma.currencyTemplateModel.deleteMany({ where: { templateId: id } });

    const template = await prisma.currencyTemplate.update({
      where: { id },
      data: {
        name,
        code,
        isDefault,
        models: {
          create: models.map((m: any, idx: number) => ({
            name: m.name,
            type: m.type,
            value: m.value,
            sortOrder: m.sortOrder ?? idx
          }))
        }
      },
      include: { models: true }
    });

    return json(template);
  } catch (error) {
    return json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE({ request, locals }: RequestEvent) {
  try {
    const session = await locals.auth?.();
    let userRoles = session?.user?.roles;

    if (!session?.user?.email) {
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
    }

    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = await request.json();

    await prisma.currencyTemplate.delete({ where: { id } });

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
