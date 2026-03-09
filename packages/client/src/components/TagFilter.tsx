import type { Tag } from '../types/bookmark';

interface TagFilterProps {
  tags: Tag[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilter({ tags, activeTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="tag-filter">
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-btn ${activeTag === tag.name ? 'active' : ''}`}
          onClick={() => onSelectTag(activeTag === tag.name ? null : tag.name)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
