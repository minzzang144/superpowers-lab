import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { bookmarksApi } from './api/bookmarks';

vi.mock('./api/bookmarks');
const mockedApi = vi.mocked(bookmarksApi);

describe('App', () => {
  it('renders the app title', async () => {
    mockedApi.getAll.mockResolvedValueOnce([]);
    render(<App />);
    expect(screen.getByText('LinkVault')).toBeInTheDocument();
  });

  it('renders bookmark form', async () => {
    mockedApi.getAll.mockResolvedValueOnce([]);
    render(<App />);
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
  });

  it('renders search bar', async () => {
    mockedApi.getAll.mockResolvedValueOnce([]);
    render(<App />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
