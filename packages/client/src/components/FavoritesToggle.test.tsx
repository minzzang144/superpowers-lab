import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FavoritesToggle } from './FavoritesToggle';

describe('FavoritesToggle', () => {
  it('renders toggle button', () => {
    render(<FavoritesToggle active={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    render(<FavoritesToggle active={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /favorites/i }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
