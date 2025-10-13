import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export async function POST({ request, locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const { action, ...data } = await request.json();

  switch (action) {
    case 'create_family':
      const existingUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { family: true }
      });
      
      let family;
      if (existingUser?.family) {
        // Update existing family
        family = await prisma.family.update({
          where: { id: existingUser.familyId },
          data: { 
            name: data.familyName,
            theme: data.theme?.id,
            interests: data.interests || []
          }
        });
      } else {
        // Create new family with default config
        family = await prisma.family.create({
          data: { 
            name: data.familyName,
            theme: data.theme?.id,
            interests: data.interests || [],
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
      
      // Update user data
      const updateData = { 
        familyId: family.id,
        roles: ['PARENT', 'ADMIN']
      };
      
      // Only update PIN if provided
      if (data.parentPin) {
        updateData.pinHash = await bcrypt.hash(data.parentPin, 10);
      }
      
      await prisma.user.update({
        where: { email: session.user.email },
        data: updateData
      });
      
      return json({ family });

    case 'create_child':
      const parent = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!parent?.familyId) return json({ error: 'No family found' }, { status: 400 });

      let child;
      if (data.id) {
        // Update existing child
        child = await prisma.user.update({
          where: { id: data.id },
          data: {
            name: data.name,
            email: data.email || undefined,
            pinHash: await bcrypt.hash(data.pin, 10),
            yearOfBirth: data.yearOfBirth ? parseInt(data.yearOfBirth) : undefined
          }
        });
      } else {
        // Create new child
        const familyConfig = await prisma.familyConfig.findUnique({
          where: { familyId: parent.familyId }
        });
        
        child = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email || `child-${Date.now()}-${Math.random().toString(36).substring(7)}@treasury.local`,
            roles: ['CHILD'],
            familyId: parent.familyId,
            parentId: parent.id,
            pinHash: await bcrypt.hash(data.pin, 10),
            currentBalance: familyConfig?.startingCapital || 480,
            yearOfBirth: data.yearOfBirth ? parseInt(data.yearOfBirth) : undefined
          }
        });
      }
      
      return json({ child });

    case 'save_pin':
      await prisma.user.update({
        where: { email: session.user.email },
        data: { pinHash: await bcrypt.hash(data.parentPin, 10) }
      });
      
      return json({ success: true });

    case 'invite_parent':
      const inviter = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (!inviter?.familyId) return json({ error: 'No family found' }, { status: 400 });

      return json({ success: true, message: 'Invitation sent' });

    case 'clear_child_pin':
      await prisma.user.update({
        where: { id: data.childId },
        data: { pinHash: null }
      });
      
      return json({ success: true });

    case 'delete_child':
      await prisma.user.delete({
        where: { id: data.childId }
      });
      
      return json({ success: true });

    case 'update_child_year':
      await prisma.user.update({
        where: { id: data.childId },
        data: { yearOfBirth: parseInt(data.yearOfBirth) }
      });
      
      return json({ success: true });

    case 'save_family_children':
      for (const child of data.children) {
        if (child.id && child.yearOfBirth) {
          await prisma.user.update({
            where: { id: child.id },
            data: { yearOfBirth: parseInt(child.yearOfBirth) }
          });
        }
      }
      
      return json({ success: true });

    default:
      return json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function GET({ locals }) {
  const session = await locals.auth();
  if (!session?.user?.email) return json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      family: {
        include: {
          users: true
        }
      }
    }
  });

  return json({ user, family: user?.family });
}