import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCategory, updateCategory, deleteCategory } from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const categoriesSlugMaybeSingleMock = vi.fn();
const categoriesInsertSelectSingleMock = vi.fn();
const categoriesUpdateSelectSingleMock = vi.fn();
const categoriesDeleteEqMock = vi.fn();
const storageUploadMock = vi.fn();
const storageGetPublicUrlMock = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    storage: {
      from: () => ({
        upload: storageUploadMock,
        getPublicUrl: storageGetPublicUrlMock,
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: profileSingleMock }) }) };
      }
      // 'categories'
      return {
        select: () => ({ eq: () => ({ maybeSingle: categoriesSlugMaybeSingleMock }) }),
        insert: (values: unknown) => ({
          select: () => ({ single: () => categoriesInsertSelectSingleMock(values) }),
        }),
        update: (values: unknown) => ({
          eq: (col: string, val: unknown) => ({
            select: () => ({ single: () => categoriesUpdateSelectSingleMock(values, col, val) }),
          }),
        }),
        delete: () => ({ eq: categoriesDeleteEqMock }),
      };
    },
  }),
}));

function imageFile(name = 'photo.jpg') {
  return new File(['x'], name, { type: 'image/jpeg' });
}

function baseFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set('title', overrides.title ?? 'Anti-Tarnish Jewellery');
  fd.set('subtitle', overrides.subtitle ?? 'Rings · Bracelets');
  fd.set('emoji', overrides.emoji ?? '💍');
  fd.set('tagStyle', overrides.tagStyle ?? 'rose');
  fd.set('tagLabel', overrides.tagLabel ?? 'Best Seller');
  fd.set('description', overrides.description ?? 'Jewellery that stays.');
  fd.set('sortOrder', overrides.sortOrder ?? '1');
  fd.set('imageAlt', overrides.imageAlt ?? '');
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  profileSingleMock.mockResolvedValue({ data: { is_admin: true } });
  categoriesSlugMaybeSingleMock.mockResolvedValue({ data: null });
  storageUploadMock.mockResolvedValue({ error: null });
  storageGetPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://cdn/img.jpg' } });
  categoriesInsertSelectSingleMock.mockResolvedValue({
    data: { slug: 'anti-tarnish-jewellery' },
    error: null,
  });
  categoriesUpdateSelectSingleMock.mockResolvedValue({
    data: { slug: 'anti-tarnish-jewellery' },
    error: null,
  });
  categoriesDeleteEqMock.mockResolvedValue({ error: null });
});

describe('createCategory', () => {
  it('rejects a non-admin caller', async () => {
    profileSingleMock.mockResolvedValue({ data: { is_admin: false } });
    const fd = baseFormData();
    fd.set('imageFile', imageFile());
    await expect(createCategory(fd)).rejects.toThrow('You must be an admin');
  });

  it('requires a title', async () => {
    const fd = baseFormData({ title: '  ' });
    fd.set('imageFile', imageFile());
    await expect(createCategory(fd)).rejects.toThrow('Please enter a category name.');
  });

  it('requires a badge label', async () => {
    const fd = baseFormData({ tagLabel: '  ' });
    fd.set('imageFile', imageFile());
    await expect(createCategory(fd)).rejects.toThrow('Please enter a badge label');
  });

  it('requires a photo', async () => {
    const fd = baseFormData();
    await expect(createCategory(fd)).rejects.toThrow('Please add a photo');
  });

  it('requires a description', async () => {
    const fd = baseFormData({ description: '  ' });
    fd.set('imageFile', imageFile());
    await expect(createCategory(fd)).rejects.toThrow('Please add a short description.');
  });

  it('slugifies the title and inserts the category with the uploaded image url', async () => {
    const fd = baseFormData();
    fd.set('imageFile', imageFile());
    const result = await createCategory(fd);

    expect(storageUploadMock).toHaveBeenCalled();
    const insertedValues = categoriesInsertSelectSingleMock.mock.calls[0][0];
    expect(insertedValues).toMatchObject({
      slug: 'anti-tarnish-jewellery',
      title: 'Anti-Tarnish Jewellery',
      tag: 'Best Seller',
      tag_bg: '#E8828F',
      tag_text: '#FFFFFF',
      image: 'https://cdn/img.jpg',
    });
    expect(result).toEqual({ slug: 'anti-tarnish-jewellery' });
  });

  it('appends a numeric suffix when the slug already exists', async () => {
    categoriesSlugMaybeSingleMock
      .mockResolvedValueOnce({ data: { slug: 'anti-tarnish-jewellery' } })
      .mockResolvedValueOnce({ data: null });
    const fd = baseFormData();
    fd.set('imageFile', imageFile());
    await createCategory(fd);

    const insertedValues = categoriesInsertSelectSingleMock.mock.calls[0][0];
    expect(insertedValues.slug).toBe('anti-tarnish-jewellery-2');
  });
});

describe('updateCategory', () => {
  it('updates fields without requiring a new photo', async () => {
    const fd = baseFormData({ title: 'Updated Title' });
    await updateCategory('anti-tarnish-jewellery', fd);

    const [updateValues, col, val] = categoriesUpdateSelectSingleMock.mock.calls[0];
    expect(updateValues.title).toBe('Updated Title');
    expect(updateValues.image).toBeUndefined();
    expect(col).toBe('slug');
    expect(val).toBe('anti-tarnish-jewellery');
  });

  it('replaces the image when a new photo is provided', async () => {
    const fd = baseFormData();
    fd.set('imageFile', imageFile());
    await updateCategory('anti-tarnish-jewellery', fd);

    const [updateValues] = categoriesUpdateSelectSingleMock.mock.calls[0];
    expect(updateValues.image).toBe('https://cdn/img.jpg');
  });
});

describe('deleteCategory', () => {
  it('deletes the category', async () => {
    await deleteCategory('anti-tarnish-jewellery');
    expect(categoriesDeleteEqMock).toHaveBeenCalledWith('slug', 'anti-tarnish-jewellery');
  });

  it('translates a foreign-key violation into a clear message', async () => {
    categoriesDeleteEqMock.mockResolvedValue({ error: { code: '23503', message: 'fk violation' } });
    await expect(deleteCategory('anti-tarnish-jewellery')).rejects.toThrow(
      'reassign them to another category first'
    );
  });
});
