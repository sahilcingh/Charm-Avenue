import { createClient } from '@/lib/supabase/server';
import Icon from '@/components/ui/AppIcon';
import type { DbTag } from '@/lib/supabase/types';
import TagManager from './TagManager';

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('label', { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-elegant-serif text-3xl md:text-[2.25rem]"
          style={{ color: 'var(--blush-text)' }}
        >
          Tags
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--blush-muted)' }}>
          Manage the fixed list of tags products can be labeled with (e.g. &quot;New&quot;,
          &quot;Bestseller&quot;), separate from categories.
        </p>
      </div>
      {error ? (
        <div className="bg-white rounded-3xl p-8 card-bubble flex items-start gap-4">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--blush-bg)' }}
          >
            <Icon
              name="ExclamationTriangleIcon"
              size={18}
              style={{ color: 'var(--blush-rose-dark)' }}
            />
          </span>
          <p className="text-sm" style={{ color: 'var(--blush-rose-dark)' }}>
            Couldn&apos;t load tags: {error.message}.
          </p>
        </div>
      ) : (
        <TagManager tags={(tags as DbTag[]) ?? []} />
      )}
    </div>
  );
}
