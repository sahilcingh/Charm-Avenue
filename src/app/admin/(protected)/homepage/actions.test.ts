import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSection, updateSection, deleteSection, reorderSection } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();

const sectionsInsertMock = vi.fn();
const sectionsInsertSelectSingleMock = vi.fn();
const sectionsUpdateEqMock = vi.fn();
const sectionsDeleteEqMock = vi.fn();
const sectionsLastSortOrderMock = vi.fn();
const sectionsListForReorderMock = vi.fn();

const sectionProductsInsertMock = vi.fn();
const sectionProductsDeleteEqMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
      }
      if (table === 'homepage_section_products') {
        return {
          insert: sectionProductsInsertMock,
          delete: () => ({ eq: sectionProductsDeleteEqMock }),
        };
      }
      // 'homepage_sections'
      return {
        insert: (values: unknown) => {
          sectionsInsertMock(values);
          return { select: () => ({ single: sectionsInsertSelectSingleMock }) };
        },
        update: (values: unknown) => ({
          eq: (col: string, val: unknown) => sectionsUpdateEqMock(values, col, val),
        }),
        delete: () => ({ eq: sectionsDeleteEqMock }),
        select: (cols: string) => {
          if (cols === 'sort_order') {
            return {
              order: () => ({ limit: () => ({ maybeSingle: sectionsLastSortOrderMock }) }),
            };
          }
          return { order: () => sectionsListForReorderMock() };
        },
      };
    },
  }),
}));

function mockLoggedOut() {
  getUserMock.mockResolvedValue({ data: { user: null } });
}

function mockNonAdmin() {
  getUserMock.mockResolvedValue({ data: { user: { id: 'customer-1' } } });
  profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
}

function mockAdmin() {
  getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
}

beforeEach(() => {
  getUserMock.mockReset();
  profileSingleMock.mockReset();
  sectionsInsertMock.mockReset();
  sectionsInsertSelectSingleMock.mockReset();
  sectionsUpdateEqMock.mockReset();
  sectionsDeleteEqMock.mockReset();
  sectionsLastSortOrderMock.mockReset();
  sectionsListForReorderMock.mockReset();
  sectionProductsInsertMock.mockReset();
  sectionProductsDeleteEqMock.mockReset();

  sectionsInsertSelectSingleMock.mockResolvedValue({ data: { id: 'section-1' }, error: null });
  sectionsUpdateEqMock.mockResolvedValue({ error: null });
  sectionsDeleteEqMock.mockResolvedValue({ error: null });
  sectionsLastSortOrderMock.mockResolvedValue({ data: null });
  sectionProductsInsertMock.mockResolvedValue({ error: null });
  sectionProductsDeleteEqMock.mockResolvedValue({ error: null });
});

function sectionFormData(
  overrides: Record<string, string> = {},
  productIds: string[] = ['p1', 'p2']
) {
  const fd = new FormData();
  fd.set('title', overrides.title ?? 'Impulse Buys You Need');
  fd.set('eyebrowEmoji', overrides.eyebrowEmoji ?? '🏷️');
  fd.set('eyebrowLabel', overrides.eyebrowLabel ?? 'Budget Friendly');
  fd.set('subtitle', overrides.subtitle ?? '');
  fd.set('layout', overrides.layout ?? 'grid');
  productIds.forEach((id) => fd.append('productIds', id));
  return fd;
}

describe('createSection — admin-only enforcement', () => {
  it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(createSection(sectionFormData())).rejects.toThrow(/admin/i);
    expect(sectionsInsertSelectSingleMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(createSection(sectionFormData())).rejects.toThrow(/admin/i);
    expect(sectionsInsertSelectSingleMock).not.toHaveBeenCalled();
  });
});

describe('createSection', () => {
  it('rejects an empty title without touching the database (failure case)', async () => {
    mockAdmin();
    await expect(createSection(sectionFormData({ title: '   ' }))).rejects.toThrow();
    expect(sectionsInsertSelectSingleMock).not.toHaveBeenCalled();
  });

  it('creates the section and links every selected product, in order', async () => {
    mockAdmin();
    await createSection(sectionFormData({}, ['p1', 'p2']));

    expect(sectionProductsInsertMock).toHaveBeenCalledWith([
      { section_id: 'section-1', product_id: 'p1', sort_order: 0 },
      { section_id: 'section-1', product_id: 'p2', sort_order: 1 },
    ]);
  });

  it('creates a section with zero products without error (curation can happen later)', async () => {
    mockAdmin();
    await createSection(sectionFormData({}, []));
    expect(sectionProductsInsertMock).not.toHaveBeenCalled();
  });

  it('places the new section after the last existing one by sort_order', async () => {
    mockAdmin();
    sectionsLastSortOrderMock.mockResolvedValue({ data: { sort_order: 4 } });
    await createSection(sectionFormData());

    expect(sectionsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ sort_order: 5 }));
  });

  it('places the first-ever section at sort_order 0 when none exist yet', async () => {
    mockAdmin();
    sectionsLastSortOrderMock.mockResolvedValue({ data: null });
    await createSection(sectionFormData());

    expect(sectionsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ sort_order: 0 }));
  });
});

describe('updateSection — admin-only enforcement', () => {
  it('rejects a logged-out caller (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(updateSection('section-1', sectionFormData())).rejects.toThrow(/admin/i);
    expect(sectionsUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('updateSection', () => {
  it('rejects an empty title (failure case)', async () => {
    mockAdmin();
    await expect(updateSection('section-1', sectionFormData({ title: '' }))).rejects.toThrow();
    expect(sectionsUpdateEqMock).not.toHaveBeenCalled();
  });

  it('saves the title/eyebrow/subtitle/layout fields', async () => {
    mockAdmin();
    await updateSection(
      'section-1',
      sectionFormData({
        title: 'Renamed Section',
        eyebrowEmoji: '💎',
        eyebrowLabel: 'Luxe Picks',
        subtitle: 'Hand-picked favorites',
        layout: 'carousel',
      })
    );

    expect(sectionsUpdateEqMock).toHaveBeenCalledWith(
      {
        title: 'Renamed Section',
        eyebrow_emoji: '💎',
        eyebrow_label: 'Luxe Picks',
        subtitle: 'Hand-picked favorites',
        layout: 'carousel',
      },
      'id',
      'section-1'
    );
  });

  it('replaces the product list wholesale (delete-then-reinsert), preserving order', async () => {
    mockAdmin();
    await updateSection('section-1', sectionFormData({}, ['p3', 'p1']));

    expect(sectionProductsDeleteEqMock).toHaveBeenCalledWith('section_id', 'section-1');
    expect(sectionProductsInsertMock).toHaveBeenCalledWith([
      { section_id: 'section-1', product_id: 'p3', sort_order: 0 },
      { section_id: 'section-1', product_id: 'p1', sort_order: 1 },
    ]);
  });

  it('can clear a section down to zero products', async () => {
    mockAdmin();
    await updateSection('section-1', sectionFormData({}, []));

    expect(sectionProductsDeleteEqMock).toHaveBeenCalledWith('section_id', 'section-1');
    expect(sectionProductsInsertMock).not.toHaveBeenCalled();
  });
});

describe('deleteSection — admin-only enforcement', () => {
  it('rejects a logged-out caller (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(deleteSection('section-1')).rejects.toThrow(/admin/i);
    expect(sectionsDeleteEqMock).not.toHaveBeenCalled();
  });
});

describe('deleteSection', () => {
  it('deletes the section by id (homepage_section_products cascade via FK)', async () => {
    mockAdmin();
    await deleteSection('section-1');
    expect(sectionsDeleteEqMock).toHaveBeenCalledWith('id', 'section-1');
  });
});

describe('reorderSection — admin-only enforcement', () => {
  it('rejects a logged-out caller (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(reorderSection('section-1', 'up')).rejects.toThrow(/admin/i);
    expect(sectionsListForReorderMock).not.toHaveBeenCalled();
  });
});

describe('reorderSection', () => {
  it('swaps sort_order with the previous section when moving up', async () => {
    mockAdmin();
    sectionsListForReorderMock.mockResolvedValue({
      data: [
        { id: 's1', sort_order: 0 },
        { id: 's2', sort_order: 1 },
      ],
      error: null,
    });

    await reorderSection('s2', 'up');

    expect(sectionsUpdateEqMock).toHaveBeenCalledWith({ sort_order: 0 }, 'id', 's2');
    expect(sectionsUpdateEqMock).toHaveBeenCalledWith({ sort_order: 1 }, 'id', 's1');
  });

  it('swaps sort_order with the next section when moving down', async () => {
    mockAdmin();
    sectionsListForReorderMock.mockResolvedValue({
      data: [
        { id: 's1', sort_order: 0 },
        { id: 's2', sort_order: 1 },
      ],
      error: null,
    });

    await reorderSection('s1', 'down');

    expect(sectionsUpdateEqMock).toHaveBeenCalledWith({ sort_order: 1 }, 'id', 's1');
    expect(sectionsUpdateEqMock).toHaveBeenCalledWith({ sort_order: 0 }, 'id', 's2');
  });

  it('does nothing when trying to move the first section up (boundary case)', async () => {
    mockAdmin();
    sectionsListForReorderMock.mockResolvedValue({
      data: [
        { id: 's1', sort_order: 0 },
        { id: 's2', sort_order: 1 },
      ],
      error: null,
    });

    await reorderSection('s1', 'up');

    expect(sectionsUpdateEqMock).not.toHaveBeenCalled();
  });

  it('does nothing when trying to move the last section down (boundary case)', async () => {
    mockAdmin();
    sectionsListForReorderMock.mockResolvedValue({
      data: [
        { id: 's1', sort_order: 0 },
        { id: 's2', sort_order: 1 },
      ],
      error: null,
    });

    await reorderSection('s2', 'down');

    expect(sectionsUpdateEqMock).not.toHaveBeenCalled();
  });
});
