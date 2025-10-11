import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
  id: string;
  name: string;
  role: string;
  roles?: string[];
  currentBalance: number;
  avatar?: string;
}

export const user = writable<User | null>(null);
export const token = writable<string | null>(null);

export function login(authToken: string, userData: User) {
  if (browser) {
    localStorage.setItem('authToken', authToken);
    token.set(authToken);
    user.set(userData);
  }
}

export function logout() {
  if (browser) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('socialSession');
    token.set(null);
    user.set(null);
  }
}

export function initAuth() {
  if (browser) {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        token.set(storedToken);
        user.set({
          id: payload.userId,
          name: payload.name,
          role: payload.role,
          currentBalance: 0
        });
      } catch {
        localStorage.removeItem('authToken');
      }
    }
  }
}

export function clearSocialSession() {
  if (browser) {
    localStorage.removeItem('socialSession');
  }
}

export function hasSocialSession() {
  if (browser) {
    const socialSession = localStorage.getItem('socialSession');
    if (socialSession) {
      const session = JSON.parse(socialSession);
      return new Date(session.expires) > new Date();
    }
  }
  return false;
}