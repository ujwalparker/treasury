import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';


const prisma = new PrismaClient();

// In-memory challenge store (replace with Redis in production)
const challengeStore = new Map();

export async function POST({ request }) {
  try {
    const { username } = await request.json();
    if (!username) {
      return json({ error: 'Username is required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: { name: username },
      include: {
        webAuthnCredentials: true
      }
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64');
    
    // Store the challenge with the user
    challengeStore.set(username, {
      challenge,
      timestamp: Date.now()
    });

    // Prepare credential creation options
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
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
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
    return json({ error: 'Failed to generate credential options' }, { status: 500 });
  }
}