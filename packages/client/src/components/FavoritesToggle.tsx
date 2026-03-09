interface FavoritesToggleProps {
  active: boolean;
  onToggle: (active: boolean) => void;
}

export function FavoritesToggle({ active, onToggle }: FavoritesToggleProps) {
  return (
    <button
      className={`favorites-toggle ${active ? 'active' : ''}`}
      aria-label="favorites"
      onClick={() => onToggle(!active)}
    >
      {active ? '★ Favorites' : '☆ Favorites'}
    </button>
  );
}
