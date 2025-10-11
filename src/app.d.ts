import type { DefaultSession } from '@auth/sveltekit';

declare global {
  namespace App {
    interface Locals {}
    interface PageData {}
    interface PageState {}
    interface Platform {}
  }
}

declare module '@auth/sveltekit' {
  interface Session {
    user: {
      id: string;
      role: string;
      currentBalance: number;
    } & DefaultSession['user'];
  }
}

export {};