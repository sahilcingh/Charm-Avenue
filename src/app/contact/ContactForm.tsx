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
                <h3 className="font-display font-black text-[#3D0030] text-xl mb-2">Message sent!</h3>
                <p className="text-[#9B4070]">Thanks for reaching out — we&apos;ll get back to you within 24 hours.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 card-bubble flex flex-col gap-4">
            <div>
                <label className="text-xs font-bold text-[#3D0030] uppercase tracking-wide mb-1.5 block">Name</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-[#3D0030] placeholder-[#9B4070]/60 text-sm border border-[#FFCCE8] focus:outline-none focus:border-[#E91E8C] transition-colors"
                    placeholder="Your name"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-[#3D0030] uppercase tracking-wide mb-1.5 block">Email</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-[#3D0030] placeholder-[#9B4070]/60 text-sm border border-[#FFCCE8] focus:outline-none focus:border-[#E91E8C] transition-colors"
                    placeholder="your@email.com"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-[#3D0030] uppercase tracking-wide mb-1.5 block">Message</label>
                <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-[#3D0030] placeholder-[#9B4070]/60 text-sm border border-[#FFCCE8] focus:outline-none focus:border-[#E91E8C] transition-colors resize-none"
                    placeholder="How can we help?"
                />
            </div>
            <button
                type="submit"
                className="mt-2 px-8 py-3.5 rounded-full font-display font-bold text-sm uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] self-start"
                style={{ background: '#E91E8C', boxShadow: '0 4px 20px rgba(233,30,140,0.35)' }}
            >
                Send Message
            </button>
        </form>
    );
}
