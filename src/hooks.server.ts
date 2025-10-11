import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '$lib/server/prisma';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET, JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

const { handle: authHandle } = SvelteKitAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  secret: AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await prisma.user.upsert({
          where: { email: user.email! },
          create: {
            email: user.email!,
            name: user.name || 'Parent',
            roles: ['PARENT'],
            currentBalance: 0,
            image: user.image,
            emailVerified: new Date()
          },
          update: {
            emailVerified: new Date()
          }
        });
      }
      return true;
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { family: true }
      });
      return { ...session, user: { ...session.user, roles: dbUser?.roles, familyId: dbUser?.familyId } };
    }
  }
});

export const handle = async ({ event, resolve }) => {
  const pinSession = event.cookies.get('pin-session');
  if (pinSession) {
    try {
      const decoded = jwt.verify(pinSession, JWT_SECRET) as any;
      event.locals.user = decoded;
    } catch (e) {
      event.cookies.delete('pin-session', { path: '/' });
    }
  }
  
  return authHandle({ event, resolve });
};