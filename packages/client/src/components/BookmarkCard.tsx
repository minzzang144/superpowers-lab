import type { Bookmark } from '../types/bookmark';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
}

export function BookmarkCard({ bookmark, onDelete, onToggleFavorite }: BookmarkCardProps) {
  return (
    <article className="bookmark-card">
      <div className="bookmark-card-header">
        <h3>{bookmark.title}</h3>
        <div className="bookmark-card-actions">
          <button
            aria-label="favorite"
            onClick={() => onToggleFavorite(bookmark.id, !bookmark.isFavorite)}
          >
            {bookmark.isFavorite ? '★' : '☆'}
          </button>
          <button
            aria-label="delete"
            onClick={() => onDelete(bookmark.id)}
          >
            ✕
          </button>
        </div>
      </div>
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.url}
      </a>
      {bookmark.memo && <p className="bookmark-memo">{bookmark.memo}</p>}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="bookmark-tags">
          {bookmark.tags.map((tag) => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}
    </article>
  );
}
