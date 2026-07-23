import { createClient } from '@/lib/supabase/server';
import type { DbTag } from '@/lib/supabase/types';
import TagManager from './TagManager';

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .order('label', { ascending: true });

  return (
    <div>
      <div className="mb-8 animate-enter">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Tags
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--blush-muted)' }}>
          Manage the fixed list of tags products can be labeled with (e.g. &quot;New&quot;,
          &quot;Bestseller&quot;) — separate from categories.
        </p>
      </div>
      <TagManager tags={(tags as DbTag[]) ?? []} />
    </div>
  );
}
