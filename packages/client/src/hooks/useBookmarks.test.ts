import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBookmarks } from './useBookmarks';
import { bookmarksApi } from '../api/bookmarks';

vi.mock('../api/bookmarks');
const mockedApi = vi.mocked(bookmarksApi);

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches bookmarks on mount', async () => {
    const data = [{ id: 1, url: 'https://a.com', title: 'A', memo: '', isFavorite: false, createdAt: '', updatedAt: '' }];
    mockedApi.getAll.mockResolvedValueOnce(data);

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockedApi.getAll.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch bookmarks');
    expect(result.current.bookmarks).toEqual([]);
  });
});
