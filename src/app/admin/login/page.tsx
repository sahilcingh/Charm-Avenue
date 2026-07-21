'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        setLoading(false);

        if (signInError) {
            setError('Incorrect email or password.');
            return;
        }

        router.push('/admin/products');
        router.refresh();
    };

    return (
        <main
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--blush-bg)' }}
        >
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <span className="font-script text-3xl inline-flex items-center gap-1" style={{ color: 'var(--blush-text)' }}>
                        Charm Avenue
                    </span>
                    <p className="text-xs font-semibold tracking-[0.35em] uppercase mt-1" style={{ color: 'var(--blush-muted)' }}>
                        Admin
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="you@charmavenue.in"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                            style={{ color: 'var(--blush-text)' }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                        style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </main>
    );
}
