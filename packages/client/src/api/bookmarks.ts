import axios from 'axios';
import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from '../types/bookmark';

const API = '/api/bookmarks';

export const bookmarksApi = {
  getAll: (params?: { search?: string; tag?: string; favorite?: boolean }) =>
    axios.get<Bookmark[]>(API, { params }).then((r) => r.data),

  getById: (id: number) =>
    axios.get<Bookmark>(`${API}/${id}`).then((r) => r.data),

  create: (input: CreateBookmarkInput) =>
    axios.post<Bookmark>(API, input).then((r) => r.data),

  update: (id: number, input: UpdateBookmarkInput) =>
    axios.put<Bookmark>(`${API}/${id}`, input).then((r) => r.data),

  remove: (id: number) =>
    axios.delete(`${API}/${id}`),

  addTag: (id: number, tagName: string) =>
    axios.post(`${API}/${id}/tags`, { name: tagName }).then((r) => r.data),

  removeTag: (id: number, tagId: number) =>
    axios.delete(`${API}/${id}/tags`, { data: { tagId } }),
};
