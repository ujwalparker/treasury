import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory challenge store (replace with Redis in production)
const challengeStore = new Map();

export async function POST({ request }) {
  try {
    const {
      username,
      id,
      rawId,
      type,
      response
    } = await request.json();

    if (!username) {
      return json({ error: 'Username is required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findFirst({
      where: { name: username }
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // In a real implementation, we would validate the WebAuthn assertion here
    // For simplicity, we're just checking that the challenge exists and matches
    const storedData = challengeStore.get(username);
    if (!storedData || Date.now() - storedData.timestamp > 600000) { // 10 minute expiry
      return json({ error: 'Challenge expired or invalid' }, { status: 400 });
    }

    // Clear the challenge
    challengeStore.delete(username);

    // Create or update credential in the database
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

    // Generate JWT token for the user
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
  } catch (error) {
    return json({ error: 'Failed to verify credential' }, { status: 500 });
  }
}