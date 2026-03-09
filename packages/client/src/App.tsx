import { useState, useCallback } from 'react';
import { useBookmarks } from './hooks/useBookmarks';
import { bookmarksApi } from './api/bookmarks';
import { BookmarkForm } from './components/BookmarkForm';
import { BookmarkList } from './components/BookmarkList';
import { SearchBar } from './components/SearchBar';
import { FavoritesToggle } from './components/FavoritesToggle';
import type { CreateBookmarkInput } from './types/bookmark';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const { bookmarks, loading, error, refetch } = useBookmarks({
    search: search || undefined,
    favorite: favoriteOnly || undefined,
  });

  const handleCreate = useCallback(async (input: CreateBookmarkInput) => {
    await bookmarksApi.create(input);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async (id: number) => {
    await bookmarksApi.remove(id);
    refetch();
  }, [refetch]);

  const handleToggleFavorite = useCallback(async (id: number, isFavorite: boolean) => {
    await bookmarksApi.update(id, { isFavorite });
    refetch();
  }, [refetch]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>LinkVault</h1>
      </header>
      <main className="app-main">
        <BookmarkForm onSubmit={handleCreate} />
        <div className="filters">
          <SearchBar onSearch={setSearch} />
          <FavoritesToggle active={favoriteOnly} onToggle={setFavoriteOnly} />
        </div>
        <BookmarkList
          bookmarks={bookmarks}
          loading={loading}
          error={error}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      </main>
    </div>
  );
}

export default App;
