'use client';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/auth-validation';
import { useToast } from '@/lib/toast-context';
import { updateName } from './actions';

export default function AccountClient({ name, email }: { name: string; email: string }) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [nameValue, setNameValue] = useState(name);
    const [editingName, setEditingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);

    const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [savingPassword, setSavingPassword] = useState(false);

    const [signingOut, setSigningOut] = useState(false);

    const handleNameSave = () => {
        setNameError(null);
        startTransition(async () => {
            const result = await updateName(nameValue);
            if (result.error) {
                setNameError(result.error);
                return;
            }
            setEditingName(false);
            showToast('Name updated');
        });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        const error = validatePassword(passwords.password);
        if (error) {
            setPasswordError(error);
            return;
        }
        if (passwords.confirmPassword !== passwords.password) {
            setPasswordError('Passwords do not match.');
            return;
        }

        setSavingPassword(true);
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password: passwords.password });
        setSavingPassword(false);

        if (updateError) {
            setPasswordError('Could not update your password. Please try again.');
            return;
        }

        setPasswords({ password: '', confirmPassword: '' });
        showToast('Password updated');
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Name</label>
                    {editingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                className="flex-1 rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                                style={{ color: 'var(--blush-text)' }}
                                placeholder="Your name"
                                autoFocus
                            />
                            <button
                                onClick={handleNameSave}
                                disabled={isPending}
                                aria-label="Save name"
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-60"
                                style={{ background: 'var(--blush-rose)' }}
                            >
                                <Icon name="CheckIcon" size={16} />
                            </button>
                            <button
                                onClick={() => { setEditingName(false); setNameValue(name); setNameError(null); }}
                                aria-label="Cancel"
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
                            >
                                <Icon name="XMarkIcon" size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-2xl px-4 py-3 border" style={{ borderColor: 'var(--blush-border)' }}>
                            <span className="text-sm font-semibold" style={{ color: 'var(--blush-text)' }}>
                                {name || 'Add your name'}
                            </span>
                            <button
                                onClick={() => setEditingName(true)}
                                aria-label="Edit name"
                                className="transition-opacity hover:opacity-70"
                                style={{ color: 'var(--blush-rose)' }}
                            >
                                <Icon name="PencilSquareIcon" size={16} />
                            </button>
                        </div>
                    )}
                    {nameError && <p className="text-xs mt-1.5" style={{ color: 'var(--blush-rose-dark)' }}>{nameError}</p>}
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Email</label>
                    <div className="rounded-2xl px-4 py-3 border" style={{ borderColor: 'var(--blush-border)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'var(--blush-text)' }}>{email}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
                <h3 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>Change Password</h3>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>New Password</label>
                    <input
                        type="password"
                        value={passwords.password}
                        onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                        style={{ color: 'var(--blush-text)' }}
                        placeholder="At least 6 characters"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Confirm New Password</label>
                    <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                        style={{ color: 'var(--blush-text)' }}
                        placeholder="••••••••"
                    />
                </div>
                {passwordError && <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{passwordError}</p>}
                <button
                    type="submit"
                    disabled={savingPassword}
                    className="mt-1 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 self-start"
                    style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
                >
                    {savingPassword ? 'Saving…' : 'Update Password'}
                </button>
            </form>

            <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-full transition-opacity hover:opacity-70 self-center disabled:opacity-50"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
            >
                {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
        </div>
    );
}
