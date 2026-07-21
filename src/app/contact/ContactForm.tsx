'use client';
import React, { useState } from 'react';

export default function ContactForm() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.name.trim() && form.email.trim() && form.message.trim()) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white rounded-3xl p-10 card-bubble text-center">
                <span className="text-4xl block mb-3">🎉</span>
                <h3 className="font-elegant-serif text-xl mb-2" style={{ color: 'var(--blush-text)' }}>Message sent!</h3>
                <p style={{ color: 'var(--blush-muted)' }}>Thanks for reaching out — we&apos;ll get back to you within 24 hours.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Name</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] placeholder-[var(--blush-muted)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="Your name"
                />
            </div>
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Email</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] placeholder-[var(--blush-muted)] transition-colors"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="your@email.com"
                />
            </div>
            <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--blush-text)' }}>Message</label>
                <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)] placeholder-[var(--blush-muted)] transition-colors resize-none"
                    style={{ color: 'var(--blush-text)' }}
                    placeholder="How can we help?"
                />
            </div>
            <button
                type="submit"
                className="mt-2 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] self-start"
                style={{ background: 'var(--blush-rose)', boxShadow: '0 4px 20px rgba(232,130,143,0.35)' }}
            >
                Send Message
            </button>
        </form>
    );
}
