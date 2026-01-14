import { writable } from 'svelte/store';

interface ToastItem {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

function createToastStore() {
    const { subscribe, update } = writable<ToastItem[]>([]);
    let nextId = 1;

    return {
        subscribe,
        success: (message: string, duration: number = 5000) => {
            const toast: ToastItem = {
                id: nextId++,
                type: 'success',
                message,
                duration
            };
            update(toasts => [...toasts, toast]);
            return toast.id;
        },
        error: (message: string, duration: number = 7000) => {
            const toast: ToastItem = {
                id: nextId++,
                type: 'error',
                message,
                duration
            };
            update(toasts => [...toasts, toast]);
            return toast.id;
        },
        warning: (message: string, duration: number = 6000) => {
            const toast: ToastItem = {
                id: nextId++,
                type: 'warning',
                message,
                duration
            };
            update(toasts => [...toasts, toast]);
            return toast.id;
        },
        info: (message: string, duration: number = 5000) => {
            const toast: ToastItem = {
                id: nextId++,
                type: 'info',
                message,
                duration
            };
            update(toasts => [...toasts, toast]);
            return toast.id;
        },
        remove: (id: number) => {
            update(toasts => toasts.filter(toast => toast.id !== id));
        },
        clear: () => {
            update(() => []);
        }
    };
}

export const toastStore = createToastStore();