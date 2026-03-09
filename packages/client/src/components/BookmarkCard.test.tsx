import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark } from '../types/bookmark';

const mockBookmark: Bookmark = {
  id: 1,
  url: 'https://example.com',
  title: 'Example Site',
  memo: 'A test bookmark',
  isFavorite: false,
  createdAt: '2026-03-09',
  updatedAt: '2026-03-09',
  tags: [{ id: 1, name: 'test' }],
};

describe('BookmarkCard', () => {
  it('renders bookmark title and URL', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders memo', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('A test bookmark')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={onDelete}
        onToggleFavorite={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('calls onToggleFavorite when favorite button clicked', async () => {
    const onToggleFavorite = vi.fn();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith(1, true);
  });
});
