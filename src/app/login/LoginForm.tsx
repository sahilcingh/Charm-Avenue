'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  validateLoginForm,
  friendlyAuthError,
  resolveLoginRedirect,
  type LoginFormErrors,
} from '@/lib/auth-validation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fieldErrors = validateLoginForm(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(form);

    if (error) {
      setLoading(false);
      setFormError(friendlyAuthError(error.message));
      return;
    }

    let isAdmin = false;
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();
      isAdmin = profile?.is_admin ?? false;
    }
    setLoading(false);

    router.push(resolveLoginRedirect({ isAdmin, next: searchParams.get('next') }));
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4"
    >
      <div>
        <label
          className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
          style={{ color: 'var(--blush-text)' }}
        >
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
          style={{ color: 'var(--blush-text)' }}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label
          className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
          style={{ color: 'var(--blush-text)' }}
        >
          Password
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
          style={{ color: 'var(--blush-text)' }}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>
            {errors.password}
          </p>
        )}
      </div>

      {formError && (
        <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
          {formError}
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

      <p className="text-center text-sm" style={{ color: 'var(--blush-muted)' }}>
        New to Charm Avenue?{' '}
        <Link
          href="/signup"
          className="font-bold hover:underline"
          style={{ color: 'var(--blush-rose)' }}
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
