import type { Bookmark } from '../types/bookmark';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
}

export function BookmarkList({ bookmarks, loading, error, onDelete, onToggleFavorite }: BookmarkListProps) {
  if (loading) return <div className="status">Loading...</div>;
  if (error) return <div className="status error">{error}</div>;
  if (bookmarks.length === 0) return <div className="status">No bookmarks yet</div>;

  return (
    <div className="bookmark-list">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
