import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '$lib/server/prisma';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const { GET: authGET, POST: authPOST } = SvelteKitAuth({
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
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || 'Parent',
              roles: ['PARENT'],
              currentBalance: 0,
              image: user.image
            }
          });
        }
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

export const GET = async (event: RequestEvent) => {
  if (event.url.pathname === '/auth/favicon.ico') {
    throw redirect(301, '/favicon.ico');
  }
  return authGET(event);
};

export const POST = authPOST;