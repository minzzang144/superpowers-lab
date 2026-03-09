import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkList } from './BookmarkList';
import type { Bookmark } from '../types/bookmark';

const mockBookmarks: Bookmark[] = [
  { id: 1, url: 'https://a.com', title: 'Site A', memo: '', isFavorite: false, createdAt: '', updatedAt: '', tags: [] },
  { id: 2, url: 'https://b.com', title: 'Site B', memo: '', isFavorite: true, createdAt: '', updatedAt: '', tags: [] },
];

describe('BookmarkList', () => {
  it('renders loading state', () => {
    render(<BookmarkList bookmarks={[]} loading={true} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<BookmarkList bookmarks={[]} loading={false} error="Failed" onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<BookmarkList bookmarks={[]} loading={false} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/no bookmarks/i)).toBeInTheDocument();
  });

  it('renders list of bookmarks', () => {
    render(<BookmarkList bookmarks={mockBookmarks} loading={false} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText('Site A')).toBeInTheDocument();
    expect(screen.getByText('Site B')).toBeInTheDocument();
  });
});
