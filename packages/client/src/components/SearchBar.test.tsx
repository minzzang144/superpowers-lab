import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onSearch after debounce delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    // Clear initial mount debounce
    await act(() => { vi.advanceTimersByTime(300); });
    onSearch.mockClear();

    await user.type(screen.getByPlaceholderText(/search/i), 'test');

    await act(() => { vi.advanceTimersByTime(300); });
    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
