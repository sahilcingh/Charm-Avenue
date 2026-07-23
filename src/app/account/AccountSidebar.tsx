'use client';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast-context';
import { updateName } from './actions';

export default function AccountSidebar({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [nameValue, setNameValue] = useState(name);
  const [editingName, setEditingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl p-6 card-bubble flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
          style={{ background: 'var(--blush-rose)' }}
        >
          {(name || email || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
                style={{ color: 'var(--blush-text)' }}
                placeholder="Your name"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                disabled={isPending}
                aria-label="Save name"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-60"
                style={{ background: 'var(--blush-rose)' }}
              >
                <Icon name="CheckIcon" size={14} />
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameValue(name);
                  setNameError(null);
                }}
                aria-label="Cancel"
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold truncate" style={{ color: 'var(--blush-text)' }}>
                {name || 'Add your name'}
              </span>
              <button
                onClick={() => setEditingName(true)}
                aria-label="Edit name"
                className="transition-opacity hover:opacity-70 shrink-0"
                style={{ color: 'var(--blush-rose)' }}
              >
                <Icon name="PencilSquareIcon" size={14} />
              </button>
            </div>
          )}
          <span className="text-xs truncate block" style={{ color: 'var(--blush-muted)' }}>
            {email}
          </span>
          {nameError && (
            <p className="text-xs mt-1" style={{ color: 'var(--blush-rose-dark)' }}>
              {nameError}
            </p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          className="text-xs font-bold uppercase tracking-wide px-4 py-2.5 rounded-full transition-opacity hover:opacity-70 disabled:opacity-50 shrink-0"
          style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
        >
          {signingOut ? '…' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
