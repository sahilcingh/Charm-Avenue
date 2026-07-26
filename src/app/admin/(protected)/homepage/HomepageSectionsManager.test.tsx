import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import HomepageSectionsManager, {
  type SectionWithProducts,
  type SectionProductOption,
} from './HomepageSectionsManager';
import { createSection, updateSection, deleteSection, reorderSection } from './actions';

vi.mock('./actions', () => ({
  createSection: vi.fn(),
  updateSection: vi.fn(),
  deleteSection: vi.fn(),
  reorderSection: vi.fn(),
}));

const products: SectionProductOption[] = [
  { id: 'p1', name: 'Cute Clip', price: 150 },
  { id: 'p2', name: 'Tiny Bag', price: 300 },
];

function makeSection(overrides: Partial<SectionWithProducts> = {}): SectionWithProducts {
  return {
    id: 's1',
    title: 'Impulse Buys You Need',
    eyebrow_emoji: '🏷️',
    eyebrow_label: 'Budget Friendly',
    subtitle: "Because cute shouldn't cost a fortune.",
    layout: 'grid',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    productIds: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HomepageSectionsManager — creating a section', () => {
  it('is disabled until a title is entered', () => {
    render(<HomepageSectionsManager sections={[]} products={products} />);
    expect(screen.getByRole('button', { name: 'Add Section' })).toBeDisabled();
  });

  it('creates a section with the entered title and selected products, in the order picked', async () => {
    const user = userEvent.setup();
    render(<HomepageSectionsManager sections={[]} products={products} />);

    await user.type(screen.getByPlaceholderText('e.g. Impulse Buys You Need'), 'New Finds');
    const [addDropdown] = screen.getAllByDisplayValue('+ Add a product…');
    await user.selectOptions(addDropdown, 'p2');
    await user.selectOptions(screen.getAllByDisplayValue('+ Add a product…')[0], 'p1');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Add Section' }));
    });

    expect(createSection).toHaveBeenCalledTimes(1);
    const fd = (createSection as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData;
    expect(fd.get('title')).toBe('New Finds');
    expect(fd.getAll('productIds')).toEqual(['p2', 'p1']);
  });
});

describe('HomepageSectionsManager — existing sections', () => {
  it('shows the section title, layout badge, and curated product names', () => {
    render(
      <HomepageSectionsManager
        sections={[makeSection({ productIds: ['p1', 'p2'] })]}
        products={products}
      />
    );

    expect(screen.getByText(/Impulse Buys You Need/)).toBeInTheDocument();
    expect(document.querySelector('.badge-pill')?.textContent).toBe('Grid');
    expect(screen.getByText('Cute Clip, Tiny Bag')).toBeInTheDocument();
  });

  it('renaming a section and saving calls updateSection with the new title', async () => {
    const user = userEvent.setup();
    render(<HomepageSectionsManager sections={[makeSection()]} products={products} />);

    await user.click(screen.getByRole('button', { name: /Edit Impulse Buys You Need/ }));
    const titleInput = screen.getByDisplayValue('Impulse Buys You Need');
    await user.clear(titleInput);
    await user.type(titleInput, 'Renamed Section');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(updateSection).toHaveBeenCalledTimes(1);
    const [id, fd] = (updateSection as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(id).toBe('s1');
    expect((fd as FormData).get('title')).toBe('Renamed Section');
  });

  it('deleting requires a confirm click before calling deleteSection', async () => {
    const user = userEvent.setup();
    render(<HomepageSectionsManager sections={[makeSection()]} products={products} />);

    await user.click(screen.getByRole('button', { name: /Delete Impulse Buys You Need/ }));
    expect(deleteSection).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Confirm' }));
    });
    expect(deleteSection).toHaveBeenCalledWith('s1');
  });

  it('the first section cannot be moved up, and the only section cannot be moved down', () => {
    render(<HomepageSectionsManager sections={[makeSection()]} products={products} />);

    expect(
      screen.getByRole('button', { name: /Move Impulse Buys You Need earlier/ })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Move Impulse Buys You Need later/ })).toBeDisabled();
  });

  it('clicking move-later on the first of two sections calls reorderSection with "down"', async () => {
    const user = userEvent.setup();
    const sections = [
      makeSection({ id: 's1', title: 'First Section', sort_order: 0 }),
      makeSection({ id: 's2', title: 'Second Section', sort_order: 1 }),
    ];
    render(<HomepageSectionsManager sections={sections} products={products} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Move First Section later/ }));
    });

    expect(reorderSection).toHaveBeenCalledWith('s1', 'down');
  });
});
