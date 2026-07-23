'use client';
import React, { useState, useTransition } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { DbTag } from '@/lib/supabase/types';
import { createTag, updateTagLabel, deleteTag } from './actions';

function TagRow({ tag }: { tag: DbTag }) {
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(tag.label);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        startTransition(async () => {
            try {
                await updateTagLabel(tag.slug, label);
                setEditing(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not save.');
            }
        });
    };

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--blush-border)' }}>
            {editing ? (
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        autoFocus
                        className="flex-1 rounded-xl px-3 py-2 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]"
                        style={{ color: 'var(--blush-text)' }}
                    />
                    <button onClick={handleSave} disabled={isPending} aria-label="Save" className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-60" style={{ background: 'var(--blush-rose)' }}>
                        <Icon name="CheckIcon" size={14} />
                    </button>
                    <button onClick={() => { setEditing(false); setLabel(tag.label); setError(null); }} aria-label="Cancel" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}>
                        <Icon name="XMarkIcon" size={14} />
                    </button>
                </div>
            ) : (
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--blush-text)' }}>{tag.label}</p>
                    <p className="text-xs" style={{ color: 'var(--blush-muted)' }}>{tag.slug}</p>
                </div>
            )}
            {error && <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{error}</p>}
            {!editing && (
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setEditing(true)}
                        aria-label={`Rename ${tag.label}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose)] hover:text-white"
                    >
                        <Icon name="PencilSquareIcon" size={15} />
                    </button>
                    {confirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => startTransition(() => deleteTag(tag.slug))}
                                disabled={isPending}
                                className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full text-white disabled:opacity-50"
                                style={{ background: 'var(--blush-rose-dark)' }}
                            >
                                {isPending ? '…' : 'Confirm'}
                            </button>
                            <button onClick={() => setConfirmingDelete(false)} aria-label="Cancel delete" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--blush-bg)', color: 'var(--blush-muted)' }}>
                                <Icon name="XMarkIcon" size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmingDelete(true)}
                            aria-label={`Delete ${tag.label}`}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--blush-muted)] transition-colors duration-200 hover:bg-[var(--blush-rose-dark)] hover:text-white"
                        >
                            <Icon name="TrashIcon" size={15} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TagManager({ tags }: { tags: DbTag[] }) {
    const [isPending, startTransition] = useTransition();
    const [newLabel, setNewLabel] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData();
        fd.set('label', newLabel);
        startTransition(async () => {
            try {
                await createTag(fd);
                setNewLabel('');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not create tag.');
            }
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <form onSubmit={handleCreate} className="bg-white rounded-3xl p-6 md:p-8 border flex flex-col gap-3" style={{ borderColor: 'var(--blush-border)' }}>
                <h2 className="font-elegant-serif text-lg" style={{ color: 'var(--blush-text)' }}>Add a Tag</h2>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Bestseller"
                        className="flex-1 rounded-2xl px-4 py-3 text-sm border border-[var(--blush-border)] focus:outline-none focus:border-[var(--blush-rose)]"
                        style={{ color: 'var(--blush-text)' }}
                    />
                    <button
                        type="submit"
                        disabled={isPending || !newLabel.trim()}
                        className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white shrink-0 disabled:opacity-60"
                        style={{ background: 'var(--blush-rose)' }}
                    >
                        {isPending ? 'Adding…' : 'Add'}
                    </button>
                </div>
                {error && <p className="text-xs font-medium" style={{ color: 'var(--blush-rose-dark)' }}>{error}</p>}
            </form>

            <div className="bg-white rounded-2xl border" style={{ borderColor: 'var(--blush-border)' }}>
                {tags.length === 0 ? (
                    <p className="text-sm px-4 py-6 text-center" style={{ color: 'var(--blush-muted)' }}>
                        No tags yet — add one above to start tagging products (e.g. &quot;New&quot;, &quot;Bestseller&quot;).
                    </p>
                ) : (
                    tags.map((tag) => <TagRow key={tag.slug} tag={tag} />)
                )}
            </div>
        </div>
    );
}
