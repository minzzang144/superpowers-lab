export interface Bookmark {
  id: number;
  url: string;
  title: string;
  memo: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface CreateBookmarkInput {
  url: string;
  title: string;
  memo?: string;
}

export interface UpdateBookmarkInput {
  url?: string;
  title?: string;
  memo?: string;
  isFavorite?: boolean;
}
