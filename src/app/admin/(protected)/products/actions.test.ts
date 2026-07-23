import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
  reorderProductImage,
  addVariant,
  updateVariant,
  removeVariant,
} from './actions';

const getUserMock = vi.fn();
const profileSingleMock = vi.fn();
const productsInsertMock = vi.fn();
const productsInsertSelectSingleMock = vi.fn();
const productsUpdateEqMock = vi.fn();
const productsDeleteEqMock = vi.fn();
const productsSlugMaybeSingleMock = vi.fn();
const auditInsertMock = vi.fn();
const storageUploadMock = vi.fn();
const storageGetPublicUrlMock = vi.fn();
const productImagesInsertMock = vi.fn();
const productImagesDeleteEqMock = vi.fn();
const productImagesUpdateEqMock = vi.fn();
const productImagesOrderedListMock = vi.fn();
const productCategoriesInsertMock = vi.fn();
const productCategoriesDeleteEqMock = vi.fn();
const productTagsInsertMock = vi.fn();
const productTagsDeleteEqMock = vi.fn();
const productVariantsInsertMock = vi.fn();
const productVariantsUpdateEqMock = vi.fn();
const productVariantsDeleteEqMock = vi.fn();

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
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
      if (table === 'admin_audit_log') {
        return { insert: auditInsertMock };
      }
      if (table === 'product_images') {
        return {
          insert: productImagesInsertMock,
          delete: () => ({ eq: productImagesDeleteEqMock }),
          update: (values: unknown) => ({
            eq: (col: string, val: unknown) => productImagesUpdateEqMock(values, col, val),
          }),
          select: () => ({ eq: () => ({ order: () => productImagesOrderedListMock() }) }),
        };
      }
      if (table === 'product_categories') {
        return {
          insert: productCategoriesInsertMock,
          delete: () => ({ eq: productCategoriesDeleteEqMock }),
        };
      }
      if (table === 'product_tags') {
        return { insert: productTagsInsertMock, delete: () => ({ eq: productTagsDeleteEqMock }) };
      }
      if (table === 'product_variants') {
        return {
          insert: productVariantsInsertMock,
          delete: () => ({ eq: productVariantsDeleteEqMock }),
          update: (values: unknown) => ({
            eq: (col: string, val: unknown) => productVariantsUpdateEqMock(values, col, val),
          }),
        };
      }
      // 'products'
      return {
        insert: productsInsertMock,
        update: () => ({ eq: productsUpdateEqMock }),
        delete: () => ({ eq: productsDeleteEqMock }),
        select: () => ({ eq: () => ({ maybeSingle: productsSlugMaybeSingleMock }) }),
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

// A minimal-but-complete form, valid enough that if the admin check were
// bypassed, the action would sail through the rest of its own logic.
function validProductFormData() {
  const fd = new FormData();
  fd.set('name', 'Sneaky Product');
  fd.set('categorySlug', 'accessories');
  fd.set('price', '100');
  fd.set('imageAlt', 'alt');
  fd.set('tagStyle', 'none');
  fd.set('emoji', '✨');
  fd.set('description', 'desc');
  fd.set('rating', '4.5');
  fd.set('reviewCount', '0');
  fd.set('isActive', 'on');
  fd.set('imageFile', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));
  return fd;
}

beforeEach(() => {
  getUserMock.mockReset();
  profileSingleMock.mockReset();
  productsInsertMock.mockReset();
  productsInsertSelectSingleMock.mockReset();
  productsUpdateEqMock.mockReset();
  productsDeleteEqMock.mockReset();
  productsSlugMaybeSingleMock.mockReset();
  auditInsertMock.mockReset();
  storageUploadMock.mockReset();
  storageGetPublicUrlMock.mockReset();
  productImagesInsertMock.mockReset();
  productImagesDeleteEqMock.mockReset();
  productImagesUpdateEqMock.mockReset();
  productImagesOrderedListMock.mockReset();
  productCategoriesInsertMock.mockReset();
  productCategoriesDeleteEqMock.mockReset();
  productTagsInsertMock.mockReset();
  productTagsDeleteEqMock.mockReset();
  productVariantsInsertMock.mockReset();
  productVariantsUpdateEqMock.mockReset();
  productVariantsDeleteEqMock.mockReset();

  productsInsertMock.mockReturnValue({
    select: () => ({ single: productsInsertSelectSingleMock }),
  });
  productsInsertSelectSingleMock.mockResolvedValue({ data: { id: 'new-product-id' }, error: null });
  productsUpdateEqMock.mockResolvedValue({ error: null });
  productsDeleteEqMock.mockResolvedValue({ error: null });
  productsSlugMaybeSingleMock.mockResolvedValue({ data: null });
  auditInsertMock.mockResolvedValue({ error: null });
  storageUploadMock.mockResolvedValue({ error: null });
  storageGetPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
  productImagesInsertMock.mockResolvedValue({ error: null });
  productImagesDeleteEqMock.mockResolvedValue({ error: null });
  productImagesUpdateEqMock.mockResolvedValue({ error: null });
  productImagesOrderedListMock.mockResolvedValue({ data: [], error: null });
  productCategoriesInsertMock.mockResolvedValue({ error: null });
  productCategoriesDeleteEqMock.mockResolvedValue({ error: null });
  productTagsInsertMock.mockResolvedValue({ error: null });
  productTagsDeleteEqMock.mockResolvedValue({ error: null });
  productVariantsInsertMock.mockResolvedValue({ error: null });
  productVariantsUpdateEqMock.mockResolvedValue({ error: null });
  productVariantsDeleteEqMock.mockResolvedValue({ error: null });
});

describe('deleteProduct — admin-only enforcement', () => {
  it('rejects a logged-out caller and never touches the database (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow(/admin/i);
    expect(productsDeleteEqMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller and never touches the database (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow(/admin/i);
    expect(productsDeleteEqMock).not.toHaveBeenCalled();
  });

  it('allows a logged-in admin to delete a product (normal case, behavior preserved)', async () => {
    mockAdmin();
    await expect(deleteProduct('p1', 'Panda Lamp')).resolves.toBeUndefined();
    expect(productsDeleteEqMock).toHaveBeenCalledWith('id', 'p1');
  });
});

describe('createProduct — admin-only enforcement', () => {
  it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(createProduct(validProductFormData())).rejects.toThrow(/admin/i);
    expect(productsInsertMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller and never inserts a row (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(createProduct(validProductFormData())).rejects.toThrow(/admin/i);
    expect(productsInsertMock).not.toHaveBeenCalled();
  });
});

describe('updateProduct — admin-only enforcement', () => {
  it('rejects a logged-out caller and never updates a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(updateProduct('p1', validProductFormData())).rejects.toThrow(/admin/i);
    expect(productsUpdateEqMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller and never updates a row (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(updateProduct('p1', validProductFormData())).rejects.toThrow(/admin/i);
    expect(productsUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('admin action audit trail', () => {
  it('logs who created a product, and with what id/name (normal case)', async () => {
    mockAdmin();
    await createProduct(validProductFormData());

    expect(auditInsertMock).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      action: 'create',
      product_id: 'new-product-id',
      product_name: 'Sneaky Product',
    });
  });

  it('logs who updated a product, and which one', async () => {
    mockAdmin();
    await updateProduct('p1', validProductFormData());

    expect(auditInsertMock).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      action: 'update',
      product_id: 'p1',
      product_name: 'Sneaky Product',
    });
  });

  it('logs who deleted a product, and which one', async () => {
    mockAdmin();
    await deleteProduct('p1', 'Panda Lamp');

    expect(auditInsertMock).toHaveBeenCalledWith({
      admin_id: 'admin-1',
      action: 'delete',
      product_id: 'p1',
      product_name: 'Panda Lamp',
    });
  });

  it('does not log anything for a rejected (non-admin) attempt', async () => {
    mockNonAdmin();
    await expect(deleteProduct('p1', 'Panda Lamp')).rejects.toThrow();
    expect(auditInsertMock).not.toHaveBeenCalled();
  });

  it('a failing audit-log write does not block the actual product mutation from succeeding (failure case)', async () => {
    mockAdmin();
    auditInsertMock.mockResolvedValue({ error: { message: 'audit table unavailable' } });

    await expect(deleteProduct('p1', 'Panda Lamp')).resolves.toBeUndefined();
    expect(productsDeleteEqMock).toHaveBeenCalledWith('id', 'p1');
  });
});

describe('createProduct — Phase 1 fields default to null/false when their section is never touched', () => {
  it('sends every Phase 1 column as null/false for a plain simple-product submission (no new sections touched)', async () => {
    mockAdmin();
    await createProduct(validProductFormData());

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sale_starts_at: null,
        sale_ends_at: null,
        dimensions: null,
        material: null,
        care_instructions: null,
        stock_status: null,
        made_to_order_lead_time: null,
        low_stock_threshold: null,
        stock_count: null,
        personalization_enabled: false,
        personalization_label: null,
        personalization_required: false,
        personalization_max_length: null,
      })
    );
  });

  it('ignores stray stock/sale/personalization values in the FormData if their enabling toggle is off (defense in depth)', async () => {
    mockAdmin();
    const fd = validProductFormData();
    // Simulates a malformed/tampered request — no trackStock/scheduleSale/personalizationEnabled toggle set.
    fd.set('stockStatus', 'out_of_stock');
    fd.set('lowStockThreshold', '2');
    fd.set('stockCount', '5');
    fd.set('saleStartsAt', '2026-01-01');
    fd.set('personalizationLabel', 'Add initials');
    fd.set('personalizationMaxLength', '30');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_status: null,
        low_stock_threshold: null,
        stock_count: null,
        sale_starts_at: null,
        personalization_label: null,
        personalization_max_length: null,
      })
    );
  });
});

describe('createProduct — Stock & Availability section', () => {
  it('saves stock_status and low_stock_threshold when tracking is turned on', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'in_stock');
    fd.set('lowStockThreshold', '2');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_status: 'in_stock',
        low_stock_threshold: 2,
        made_to_order_lead_time: null,
      })
    );
  });

  it('only saves made_to_order_lead_time when stock_status is made_to_order', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'out_of_stock');
    fd.set('madeToOrderLeadTime', 'Ships in 5-7 days');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ made_to_order_lead_time: null })
    );
  });

  it('saves made_to_order_lead_time when stock_status is made_to_order', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'made_to_order');
    fd.set('madeToOrderLeadTime', 'Ships in 5-7 days');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ made_to_order_lead_time: 'Ships in 5-7 days' })
    );
  });

  it('leaves low_stock_threshold null when tracking is on but the field is left blank', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'in_stock');
    fd.set('lowStockThreshold', '');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ low_stock_threshold: null })
    );
  });

  it('saves stock_count when tracking is turned on', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'in_stock');
    fd.set('stockCount', '7');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ stock_count: 7 }));
  });

  it('leaves stock_count null when tracking is on but the field is left blank', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('trackStock', 'on');
    fd.set('stockStatus', 'in_stock');
    fd.set('stockCount', '');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(expect.objectContaining({ stock_count: null }));
  });
});

describe('createProduct — Sale Window section', () => {
  it('saves the sale window as an inclusive full-day range when scheduling is turned on', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('scheduleSale', 'on');
    fd.set('saleStartsAt', '2026-08-01');
    fd.set('saleEndsAt', '2026-08-15');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sale_starts_at: '2026-08-01T00:00:00.000Z',
        sale_ends_at: '2026-08-15T23:59:59.999Z',
      })
    );
  });
});

describe('createProduct — More Details section', () => {
  it('trims and saves dimensions/material/care_instructions when provided', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('dimensions', '  5cm x 3cm  ');
    fd.set('material', 'Sterling silver');
    fd.set('careInstructions', 'Keep dry');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: '5cm x 3cm',
        material: 'Sterling silver',
        care_instructions: 'Keep dry',
      })
    );
  });
});

describe('createProduct — Personalization section', () => {
  it('saves label/required/max_length when personalization is enabled', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('personalizationEnabled', 'on');
    fd.set('personalizationLabel', 'Add your initials');
    fd.set('personalizationRequired', 'on');
    fd.set('personalizationMaxLength', '20');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        personalization_enabled: true,
        personalization_label: 'Add your initials',
        personalization_required: true,
        personalization_max_length: 20,
      })
    );
  });

  it('falls back to a 50-character cap when enabled but max length is left blank', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('personalizationEnabled', 'on');
    fd.set('personalizationLabel', 'Add your initials');

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ personalization_max_length: 50 })
    );
  });

  it('ignores personalizationRequired when personalization itself is not enabled', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.set('personalizationRequired', 'on'); // stray value, no personalizationEnabled

    await createProduct(fd);

    expect(productsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ personalization_enabled: false, personalization_required: false })
    );
  });
});

function galleryFormData(fileName = 'extra.jpg') {
  const fd = new FormData();
  fd.set('imageFile', new File(['bytes'], fileName, { type: 'image/jpeg' }));
  fd.set('alt', 'Side angle');
  return fd;
}

describe('addProductImage — admin-only enforcement', () => {
  it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(addProductImage('product-1', galleryFormData())).rejects.toThrow(/admin/i);
    expect(productImagesInsertMock).not.toHaveBeenCalled();
  });

  it('rejects a logged-in non-admin caller and never inserts a row (vulnerability case)', async () => {
    mockNonAdmin();
    await expect(addProductImage('product-1', galleryFormData())).rejects.toThrow(/admin/i);
    expect(productImagesInsertMock).not.toHaveBeenCalled();
  });
});

describe('addProductImage', () => {
  it('rejects when no file is provided, without touching storage or the database (failure case)', async () => {
    mockAdmin();
    await expect(addProductImage('product-1', new FormData())).rejects.toThrow(/photo/i);
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(productImagesInsertMock).not.toHaveBeenCalled();
  });

  it('uploads the file and inserts a product_images row for the given product', async () => {
    mockAdmin();
    await addProductImage('product-1', galleryFormData());

    expect(storageUploadMock).toHaveBeenCalled();
    expect(productImagesInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'product-1',
        url: 'https://example.com/photo.jpg',
        alt: 'Side angle',
      })
    );
  });
});

describe('removeProductImage — admin-only enforcement', () => {
  it('rejects a logged-out caller and never deletes a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(removeProductImage('image-1', 'product-1')).rejects.toThrow(/admin/i);
    expect(productImagesDeleteEqMock).not.toHaveBeenCalled();
  });
});

describe('removeProductImage', () => {
  it('deletes the image row by id', async () => {
    mockAdmin();
    await removeProductImage('image-1', 'product-1');
    expect(productImagesDeleteEqMock).toHaveBeenCalledWith('id', 'image-1');
  });
});

describe('reorderProductImage — admin-only enforcement', () => {
  it('rejects a logged-out caller and never updates a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(reorderProductImage('image-1', 'product-1', 'up')).rejects.toThrow(/admin/i);
    expect(productImagesUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('reorderProductImage', () => {
  it('swaps sort_order with the previous image when moving up', async () => {
    mockAdmin();
    productImagesOrderedListMock.mockResolvedValue({
      data: [
        { id: 'img-1', sort_order: 10 },
        { id: 'img-2', sort_order: 20 },
      ],
      error: null,
    });

    await reorderProductImage('img-2', 'product-1', 'up');

    expect(productImagesUpdateEqMock).toHaveBeenCalledWith({ sort_order: 10 }, 'id', 'img-2');
    expect(productImagesUpdateEqMock).toHaveBeenCalledWith({ sort_order: 20 }, 'id', 'img-1');
  });

  it('swaps sort_order with the next image when moving down', async () => {
    mockAdmin();
    productImagesOrderedListMock.mockResolvedValue({
      data: [
        { id: 'img-1', sort_order: 10 },
        { id: 'img-2', sort_order: 20 },
      ],
      error: null,
    });

    await reorderProductImage('img-1', 'product-1', 'down');

    expect(productImagesUpdateEqMock).toHaveBeenCalledWith({ sort_order: 20 }, 'id', 'img-1');
    expect(productImagesUpdateEqMock).toHaveBeenCalledWith({ sort_order: 10 }, 'id', 'img-2');
  });

  it('does nothing when trying to move the first image up (boundary case)', async () => {
    mockAdmin();
    productImagesOrderedListMock.mockResolvedValue({
      data: [
        { id: 'img-1', sort_order: 10 },
        { id: 'img-2', sort_order: 20 },
      ],
      error: null,
    });

    await reorderProductImage('img-1', 'product-1', 'up');

    expect(productImagesUpdateEqMock).not.toHaveBeenCalled();
  });

  it('does nothing when trying to move the last image down (boundary case)', async () => {
    mockAdmin();
    productImagesOrderedListMock.mockResolvedValue({
      data: [
        { id: 'img-1', sort_order: 10 },
        { id: 'img-2', sort_order: 20 },
      ],
      error: null,
    });

    await reorderProductImage('img-2', 'product-1', 'down');

    expect(productImagesUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('createProduct — Categories & Tags sync', () => {
  it('adds the primary category to product_categories, with no extra categories or tags by default', async () => {
    mockAdmin();
    await createProduct(validProductFormData());

    expect(productCategoriesInsertMock).toHaveBeenCalledWith([
      { product_id: 'new-product-id', category_slug: 'accessories' },
    ]);
    expect(productTagsInsertMock).not.toHaveBeenCalled();
  });

  it('includes selected extra categories (deduplicated against the primary) and tags', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.append('extraCategories', 'pouches');
    fd.append('extraCategories', 'accessories'); // duplicate of the primary — must not create a second row
    fd.append('tags', 'bestseller');
    fd.append('tags', 'new-in');

    await createProduct(fd);

    const insertedCategories = productCategoriesInsertMock.mock.calls[0][0];
    expect(insertedCategories).toHaveLength(2);
    expect(insertedCategories).toEqual(
      expect.arrayContaining([
        { product_id: 'new-product-id', category_slug: 'accessories' },
        { product_id: 'new-product-id', category_slug: 'pouches' },
      ])
    );
    expect(productTagsInsertMock).toHaveBeenCalledWith([
      { product_id: 'new-product-id', tag_slug: 'bestseller' },
      { product_id: 'new-product-id', tag_slug: 'new-in' },
    ]);
  });
});

describe('updateProduct — Categories & Tags sync', () => {
  it('resyncs by deleting existing rows first, then inserting the current selection', async () => {
    mockAdmin();
    const fd = validProductFormData();
    fd.append('tags', 'bestseller');

    await updateProduct('p1', fd);

    expect(productCategoriesDeleteEqMock).toHaveBeenCalledWith('product_id', 'p1');
    expect(productTagsDeleteEqMock).toHaveBeenCalledWith('product_id', 'p1');
    expect(productCategoriesInsertMock).toHaveBeenCalledWith([
      { product_id: 'p1', category_slug: 'accessories' },
    ]);
    expect(productTagsInsertMock).toHaveBeenCalledWith([
      { product_id: 'p1', tag_slug: 'bestseller' },
    ]);
  });
});

describe('addVariant — admin-only enforcement', () => {
  it('rejects a logged-out caller and never inserts a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(addVariant('product-1')).rejects.toThrow(/admin/i);
    expect(productVariantsInsertMock).not.toHaveBeenCalled();
  });
});

describe('addVariant', () => {
  it('inserts a blank variant row for the given product', async () => {
    mockAdmin();
    await addVariant('product-1');
    expect(productVariantsInsertMock).toHaveBeenCalledWith({ product_id: 'product-1' });
  });
});

describe('updateVariant — admin-only enforcement', () => {
  it('rejects a logged-out caller and never updates a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(updateVariant('variant-1', 'product-1', new FormData())).rejects.toThrow(/admin/i);
    expect(productVariantsUpdateEqMock).not.toHaveBeenCalled();
  });
});

describe('updateVariant', () => {
  it('parses color/size/price/stock fields, converting blanks to null', async () => {
    mockAdmin();
    const fd = new FormData();
    fd.set('color', 'Red');
    fd.set('size', '');
    fd.set('priceOverride', '350');
    fd.set('originalPriceOverride', '');
    fd.set('stockStatus', 'in_stock');
    fd.set('stockCount', '5');

    await updateVariant('variant-1', 'product-1', fd);

    expect(productVariantsUpdateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'Red',
        size: null,
        price_override: 350,
        original_price_override: null,
        stock_status: 'in_stock',
        stock_count: 5,
      }),
      'id',
      'variant-1'
    );
  });

  it('stores null instead of an invalid stock_status (defense in depth)', async () => {
    mockAdmin();
    const fd = new FormData();
    fd.set('stockStatus', 'bogus_value');

    await updateVariant('variant-1', 'product-1', fd);

    expect(productVariantsUpdateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({ stock_status: null }),
      'id',
      'variant-1'
    );
  });

  it('uploads a new image and includes it in the update when provided', async () => {
    mockAdmin();
    const fd = new FormData();
    fd.set('imageFile', new File(['bytes'], 'red.jpg', { type: 'image/jpeg' }));

    await updateVariant('variant-1', 'product-1', fd);

    expect(storageUploadMock).toHaveBeenCalled();
    expect(productVariantsUpdateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({ image: 'https://example.com/photo.jpg' }),
      'id',
      'variant-1'
    );
  });

  it('does not touch the image field when no new file is provided', async () => {
    mockAdmin();
    await updateVariant('variant-1', 'product-1', new FormData());

    expect(storageUploadMock).not.toHaveBeenCalled();
    const [update] = productVariantsUpdateEqMock.mock.calls[0];
    expect(update).not.toHaveProperty('image');
  });

  it('defaults is_active to true when not explicitly turned off', async () => {
    mockAdmin();
    await updateVariant('variant-1', 'product-1', new FormData());
    expect(productVariantsUpdateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
      'id',
      'variant-1'
    );
  });

  it('retires the variant when isActive is explicitly set to off', async () => {
    mockAdmin();
    const fd = new FormData();
    fd.set('isActive', 'off');
    await updateVariant('variant-1', 'product-1', fd);
    expect(productVariantsUpdateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
      'id',
      'variant-1'
    );
  });
});

describe('removeVariant — admin-only enforcement', () => {
  it('rejects a logged-out caller and never deletes a row (vulnerability case)', async () => {
    mockLoggedOut();
    await expect(removeVariant('variant-1', 'product-1')).rejects.toThrow(/admin/i);
    expect(productVariantsDeleteEqMock).not.toHaveBeenCalled();
  });
});

describe('removeVariant', () => {
  it('deletes the variant by id', async () => {
    mockAdmin();
    await removeVariant('variant-1', 'product-1');
    expect(productVariantsDeleteEqMock).toHaveBeenCalledWith('id', 'variant-1');
  });
});
