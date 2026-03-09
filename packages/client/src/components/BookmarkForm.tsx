import { useState, type FormEvent } from 'react';
import type { CreateBookmarkInput } from '../types/bookmark';

interface BookmarkFormProps {
  onSubmit: (input: CreateBookmarkInput) => void;
}

export function BookmarkForm({ onSubmit }: BookmarkFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;
    onSubmit({ url: url.trim(), title: title.trim(), memo: memo.trim() || undefined });
    setUrl('');
    setTitle('');
    setMemo('');
  };

  return (
    <form className="bookmark-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="url">URL</label>
        <input id="url" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-field">
        <label htmlFor="title">Title</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bookmark title" />
      </div>
      <div className="form-field">
        <label htmlFor="memo">Memo</label>
        <textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Optional note" />
      </div>
      <button type="submit">Add Bookmark</button>
    </form>
  );
}
