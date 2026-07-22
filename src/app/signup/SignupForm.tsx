'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast-context';
import { validateSignupForm, validateOtp, friendlyAuthError, type SignupFormErrors } from '@/lib/auth-validation';

export default function SignupForm() {
    const router = useRouter();
    const { showToast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<SignupFormErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [awaitingOtp, setAwaitingOtp] = useState(false);

    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const fieldErrors = validateSignupForm(form);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { name: form.name.trim() } },
        });
        setLoading(false);

        if (error) {
            if (error.message === 'User already registered') {
                // Don't reveal that this email already has an account — behave identically
                // to a fresh signup, or this becomes a way to probe arbitrary emails and
                // find out who's registered.
                setAwaitingOtp(true);
                return;
            }
            setFormError(friendlyAuthError(error.message));
            return;
        }

        if (!data.session) {
            // Email confirmation is on for this project — no session until they enter the code we emailed them.
            setAwaitingOtp(true);
            return;
        }

        router.push('/');
        router.refresh();
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpError(null);

        const codeError = validateOtp(otp);
        if (codeError) {
            setOtpError(codeError);
            return;
        }

        setVerifying(true);
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({ email: form.email, token: otp.trim(), type: 'signup' });
        setVerifying(false);

        if (error) {
            setOtpError(friendlyAuthError(error.message));
            return;
        }

        router.push('/');
        router.refresh();
    };

    const handleResend = async () => {
        setResending(true);
        const supabase = createClient();
        const { error } = await supabase.auth.resend({ type: 'signup', email: form.email });
        setResending(false);

        showToast(error ? 'Could not resend the code. Please try again.' : 'A new code is on its way.');
    };

    if (awaitingOtp) {
        return (
            <form onSubmit={handleVerifyOtp} className="bg-white rounded-3xl p-8 card-bubble text-center flex flex-col gap-4">
                <span className="text-4xl block">📬</span>
                <div>
                    <h3 className="font-elegant-serif text-xl mb-2" style={{ color: 'var(--blush-text)' }}>Check your inbox</h3>
                    <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
                        We&apos;ve sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to finish creating your account.
                    </p>
                </div>

                <div className="text-left">
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>
                        Verification Code
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full rounded-2xl px-4 py-3 text-center text-lg tracking-[0.5em] border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                        style={{ color: 'var(--blush-text)' }}
                        placeholder="123456"
                    />
                    {otpError && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{otpError}</p>}
                </div>

                <button
                    type="submit"
                    disabled={verifying}
                    className="px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                    style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                >
                    {verifying ? 'Verifying…' : 'Verify & Continue'}
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm font-bold hover:underline disabled:opacity-60"
                    style={{ color: 'var(--blush-rose)' }}
                >
                    {resending ? 'Resending…' : 'Resend code'}
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Name</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="Your name"
                />
                {errors.name && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.name}</p>}
            </div>
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Email</label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.email}</p>}
            </div>
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Password</label>
                <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="At least 6 characters"
                />
                {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.password}</p>}
            </div>
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Confirm Password</label>
                <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{errors.confirmPassword}</p>}
            </div>

            {formError && (
                <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{formError}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
            >
                {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--blush-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--blush-rose)' }}>
                    Sign in
                </Link>
            </p>
        </form>
    );
}
