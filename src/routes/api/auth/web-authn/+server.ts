import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import crypto from 'crypto';

const challengeStore = new Map();

export async function POST({ request }) {
  try {
    const { username, id, rawId, type, response, verify } = await request.json();

    if (!username) {
      return json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { name: username },
      include: { webAuthnCredentials: true }
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Verify credential
    if (verify) {
      const storedData = challengeStore.get(username);
      if (!storedData || Date.now() - storedData.timestamp > 600000) {
        return json({ error: 'Challenge expired or invalid' }, { status: 400 });
      }

      challengeStore.delete(username);

      await prisma.webAuthnCredential.upsert({
        where: { id },
        update: {
          publicKey: rawId,
          counter: BigInt(response.counter || 0)
        },
        create: {
          id,
          userId: user.id,
          publicKey: rawId,
          counter: BigInt(response.counter || 0),
          credentialType: type
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return json({
        token,
        userId: user.id,
        name: user.name,
        role: user.role,
        currentBalance: user.currentBalance
      });
    }

    // Generate options
    const challenge = crypto.randomBytes(32).toString('base64');
    
    challengeStore.set(username, {
      challenge,
      timestamp: Date.now()
    });

    const credentialCreationOptions = {
      rp: {
        name: 'Treasury',
        id: request.headers.get('host') || 'localhost'
      },
      user: {
        id: user.id,
        name: user.name,
        displayName: user.name
      },
      challenge,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      attestation: 'none',
      excludeCredentials: user.webAuthnCredentials.map(credential => ({
        id: credential.id,
        type: 'public-key'
      }))
    };

    return json(credentialCreationOptions);
  } catch (error) {
    return json({ error: 'Failed to process WebAuthn request' }, { status: 500 });
  }
}