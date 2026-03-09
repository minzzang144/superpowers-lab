import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [value, onSearch]);

  return (
    <input
      className="search-bar"
      type="text"
      placeholder="Search bookmarks..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
