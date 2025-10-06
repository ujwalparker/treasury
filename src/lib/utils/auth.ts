import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: string;
  name: string;
  role: string;
  currentBalance: number;
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      currentBalance: user.currentBalance
    };
  } catch {
    return null;
  }
}

export async function authenticateUser(name: string, role: string, pin: string) {
  const user = await prisma.user.findFirst({
    where: { name, role }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isValidPin = await bcrypt.compare(pin, user.pinHash);
  if (!isValidPin) {
    throw new Error('Invalid PIN');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user };
}