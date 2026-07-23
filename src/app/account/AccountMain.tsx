'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/auth-validation';
import { useToast } from '@/lib/toast-context';
import { ORDER_STATUS_LABELS } from '@/lib/order-status';
import type { DbOrder } from '@/lib/supabase/types';
import { updateContactInfo } from './actions';

type OrderSummary = Pick<DbOrder, 'id' | 'status' | 'subtotal' | 'created_at'>;

export default function AccountMain({
  phone,
  address,
  orders,
}: {
  phone: string;
  address: string;
  orders: OrderSummary[];
}) {
  const { showToast } = useToast();

  const [contact, setContact] = useState({ phone, address });
  const [contactError, setContactError] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setSavingContact(true);

    const result = await updateContactInfo(contact.phone, contact.address);
    setSavingContact(false);

    if (result.error) {
      setContactError(result.error);
      return;
    }
    showToast('Delivery details saved');
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

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
        <h3 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>
          Order History
        </h3>
        {orders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--blush-muted)' }}>
            You haven&apos;t placed any orders yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orders.map((order) => {
              const status = ORDER_STATUS_LABELS[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border transition-colors hover:border-[var(--blush-rose)]"
                  style={{ borderColor: 'var(--blush-border)' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--blush-text)' }}>
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--blush-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}₹{order.subtotal}
                    </span>
                  </div>
                  <span
                    className="badge-pill text-xs font-bold shrink-0"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <form
          onSubmit={handleContactSubmit}
          className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4"
        >
          <div>
            <h3 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>
              Delivery Details
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--blush-muted)' }}>
              Saved here, so checkout can pre-fill them next time.
            </p>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
              style={{ color: 'var(--blush-text)' }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
              style={{ color: 'var(--blush-text)' }}
              placeholder="98765 43210"
            />
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
              style={{ color: 'var(--blush-text)' }}
            >
              Delivery Address
            </label>
            <textarea
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors resize-none"
              style={{ color: 'var(--blush-text)' }}
              placeholder="House/flat, street, area, city, PIN code"
            />
          </div>
          {contactError && (
            <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
              {contactError}
            </p>
          )}
          <button
            type="submit"
            disabled={savingContact}
            className="mt-1 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 self-start"
            style={{
              background: 'var(--blush-rose)',
              boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
            }}
          >
            {savingContact ? 'Saving…' : 'Save Delivery Details'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4"
        >
          <h3 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>
            Change Password
          </h3>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
              style={{ color: 'var(--blush-text)' }}
            >
              New Password
            </label>
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
            <label
              className="text-xs font-bold uppercase tracking-wide mb-1.5 block"
              style={{ color: 'var(--blush-text)' }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] transition-colors"
              style={{ color: 'var(--blush-text)' }}
              placeholder="••••••••"
            />
          </div>
          {passwordError && (
            <p className="text-sm font-medium" style={{ color: 'var(--blush-rose-dark)' }}>
              {passwordError}
            </p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="mt-1 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 self-start"
            style={{
              background: 'var(--blush-rose)',
              boxShadow: '0 4px 20px rgba(232,130,143,0.35)',
            }}
          >
            {savingPassword ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
