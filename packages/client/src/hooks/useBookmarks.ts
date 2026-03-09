import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/bookmarks';
import type { Bookmark } from '../types/bookmark';

interface UseBookmarksParams {
  search?: string;
  tag?: string;
  favorite?: boolean;
}

export function useBookmarks(params?: UseBookmarksParams) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarksApi.getAll(params);
      setBookmarks(data);
    } catch {
      setError('Failed to fetch bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.tag, params?.favorite]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { bookmarks, loading, error, refetch: fetchBookmarks };
}
