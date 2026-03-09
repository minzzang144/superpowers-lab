import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { bookmarksApi } from './bookmarks';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('bookmarksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll should call GET /api/bookmarks', async () => {
    const data = [{ id: 1, url: 'https://example.com', title: 'Example' }];
    mockedAxios.get.mockResolvedValueOnce({ data });

    const result = await bookmarksApi.getAll();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/bookmarks', { params: undefined });
    expect(result).toEqual(data);
  });

  it('create should call POST /api/bookmarks', async () => {
    const input = { url: 'https://example.com', title: 'Example' };
    const data = { id: 1, ...input };
    mockedAxios.post.mockResolvedValueOnce({ data });

    const result = await bookmarksApi.create(input);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/bookmarks', input);
    expect(result).toEqual(data);
  });

  it('remove should call DELETE /api/bookmarks/:id', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});

    await bookmarksApi.remove(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/bookmarks/1');
  });
});
