'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface ToastOptions {
    href?: string;
    actionLabel?: string;
}

interface ToastItem extends ToastOptions {
    id: number;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, options?: ToastOptions) => {
        const id = ++nextToastId;
        setToasts((prev) => [...prev, { id, message, ...options }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2800);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-5 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="pointer-events-auto flex items-center gap-3 bg-white rounded-full pl-3 pr-4 py-2.5 card-bubble animate-bounce-in"
                    >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--blush-rose)' }}>
                            <Icon name="CheckIcon" size={14} className="text-white" />
                        </span>
                        <span className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>{t.message}</span>
                        {t.href && (
                            <Link
                                href={t.href}
                                className="text-xs font-bold uppercase tracking-wide hover:underline shrink-0"
                                style={{ color: 'var(--blush-rose)' }}
                            >
                                {t.actionLabel ?? 'View'}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
