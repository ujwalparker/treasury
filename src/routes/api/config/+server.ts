import { json } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/auth';
import { prisma } from '$lib/server/prisma';
import { DEFAULT_GROQ_MODEL, DEFAULT_GEMINI_MODEL } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ request, locals }: RequestEvent) {
  try {
    // Try Auth.js session first
    const session = await locals.auth?.();
    let userEmail = session?.user?.email;
    let userRoles = session?.user?.roles;

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
    }

    // Only ADMIN can access configuration
    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const config = await prisma.adminConfig.findFirst() || await prisma.adminConfig.create({
      data: {}
    });

    return json({
      ...config,
      groqModel: config.groqModel || DEFAULT_GROQ_MODEL,
      geminiModel: config.geminiModel || DEFAULT_GEMINI_MODEL
    });
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
    }

    // Only ADMIN can update configuration
    if (!userRoles?.includes('ADMIN')) {
      return json({ error: 'Permission denied' }, { status: 403 });
    }

    const { 
      defaultLlmProvider,
      groqApiKey,
      geminiApiKey,
      groqModel,
      geminiModel,
      verificationKeywords
    } = await request.json();

    if (defaultLlmProvider && !['groq', 'gemini'].includes(defaultLlmProvider)) {
      return json({ error: 'Invalid LLM provider' }, { status: 400 });
    }

    const updateData: any = {};
    if (defaultLlmProvider !== undefined) updateData.defaultLlmProvider = defaultLlmProvider;
    if (groqApiKey !== undefined) updateData.groqApiKey = groqApiKey;
    if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey;
    if (groqModel !== undefined) updateData.groqModel = groqModel;
    if (geminiModel !== undefined) updateData.geminiModel = geminiModel;
    if (verificationKeywords !== undefined) updateData.verificationKeywords = verificationKeywords;

    const existingConfig = await prisma.adminConfig.findFirst();
    
    const updatedConfig = existingConfig 
      ? await prisma.adminConfig.update({
          where: { id: existingConfig.id },
          data: updateData
        })
      : await prisma.adminConfig.create({
          data: updateData
        });

    return json(updatedConfig);
  } catch (error) {
    return json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}