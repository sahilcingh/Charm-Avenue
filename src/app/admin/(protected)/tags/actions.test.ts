import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTag, updateTagLabel, deleteTag } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const tagsInsertMock = vi.fn();
const tagsUpdateEqMock = vi.fn();
const tagsDeleteEqMock = vi.fn();
const tagsSlugMaybeSingleMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
      }
      // 'tags'
      return {
        insert: tagsInsertMock,
        update: () => ({ eq: tagsUpdateEqMock }),
        delete: () => ({ eq: tagsDeleteEqMock }),
        select: () => ({ eq: () => ({ maybeSingle: tagsSlugMaybeSingleMock }) }),
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
  tagsInsertMock.mockReset();
  tagsUpdateEqMock.mockReset();
  tagsDeleteEqMock.mockReset();
  tagsSlugMaybeSingleMock.mockReset();

  tagsInsertMock.mockResolvedValue({ error: null });
  tagsUpdateEqMock.mockResolvedValue({ error: null });
  tagsDeleteEqMock.mockResolvedValue({ error: null });
  tagsSlugMaybeSingleMock.mockResolvedValue({ data: null });
});

function formDataWithLabel(label: string) {
  const fd = new FormData();
  fd.set('label', label);
  return fd;
}

describe('createTag — admin-only enforcement', () => {
  it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(createTag(formDataWithLabel('Bestseller'))).rejects.toThrow(/admin/i);
    expect(tagsInsertMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(createTag(formDataWithLabel('Bestseller'))).rejects.toThrow(/admin/i);
    expect(tagsInsertMock).not.toHaveBeenCalled();
  });
});

describe('createTag', () => {
  it('rejects an empty label without touching the database (failure case)', async () => {
    mockAdmin();
    await expect(createTag(formDataWithLabel('   '))).rejects.toThrow();
    expect(tagsInsertMock).not.toHaveBeenCalled();
  });

  it('slugifies the label for a new tag', async () => {
    mockAdmin();
    await createTag(formDataWithLabel('Best Seller'));
    expect(tagsInsertMock).toHaveBeenCalledWith({ slug: 'best-seller', label: 'Best Seller' });
  });

  it('appends a numeric suffix when the slug already exists (collision case)', async () => {
    mockAdmin();
    tagsSlugMaybeSingleMock
      .mockResolvedValueOnce({ data: { slug: 'new' } })
      .mockResolvedValueOnce({ data: null });
    await createTag(formDataWithLabel('New'));
    expect(tagsInsertMock).toHaveBeenCalledWith({ slug: 'new-2', label: 'New' });
  });
});

describe('updateTagLabel — admin-only enforcement', () => {
  it('rejects a logged-out caller (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(updateTagLabel('bestseller', 'New Name')).rejects.toThrow(/admin/i);
    expect(tagsUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('updateTagLabel', () => {
  it('rejects an empty label (failure case)', async () => {
    mockAdmin();
    await expect(updateTagLabel('bestseller', '   ')).rejects.toThrow();
    expect(tagsUpdateEqMock).not.toHaveBeenCalled();
  });

  it('updates the label, trimmed, without changing the slug', async () => {
    mockAdmin();
    await updateTagLabel('bestseller', '  Best Seller!  ');
    expect(tagsUpdateEqMock).toHaveBeenCalledWith('slug', 'bestseller');
  });
});

describe('deleteTag — admin-only enforcement', () => {
  it('rejects a logged-out caller (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(deleteTag('bestseller')).rejects.toThrow(/admin/i);
    expect(tagsDeleteEqMock).not.toHaveBeenCalled();
  });
});

describe('deleteTag', () => {
  it('deletes the tag by slug', async () => {
    mockAdmin();
    await deleteTag('bestseller');
    expect(tagsDeleteEqMock).toHaveBeenCalledWith('slug', 'bestseller');
  });
});
