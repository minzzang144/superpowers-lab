import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkForm } from './BookmarkForm';

describe('BookmarkForm', () => {
  it('renders URL, title, and memo inputs', () => {
    render(<BookmarkForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/memo/i)).toBeInTheDocument();
  });

  it('calls onSubmit with form data when submitted', async () => {
    const onSubmit = vi.fn();
    render(<BookmarkForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/url/i), 'https://example.com');
    await userEvent.type(screen.getByLabelText(/title/i), 'Example');
    await userEvent.type(screen.getByLabelText(/memo/i), 'My note');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      url: 'https://example.com',
      title: 'Example',
      memo: 'My note',
    });
  });

  it('does not submit when URL is empty', async () => {
    const onSubmit = vi.fn();
    render(<BookmarkForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Example');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears form after successful submit', async () => {
    const onSubmit = vi.fn();
    render(<BookmarkForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/url/i), 'https://example.com');
    await userEvent.type(screen.getByLabelText(/title/i), 'Example');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByLabelText(/url/i)).toHaveValue('');
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
  });
});
