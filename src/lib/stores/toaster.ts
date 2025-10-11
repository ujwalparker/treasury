import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  type: ToastType;
  message: string;
}

function createToasterStore() {
  const { subscribe, update } = writable<ToastData[]>([]);

  return {
    subscribe,
    add: (message: string, type: ToastType = 'info') => {
      update(toasts => [...toasts, { message, type }]);
    },
    remove: (index: number) => {
      update(toasts => toasts.filter((_, i) => i !== index));
    }
  };
}

export const toaster = createToasterStore();
