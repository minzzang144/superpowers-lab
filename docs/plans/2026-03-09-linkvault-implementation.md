# LinkVault Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bookmark management web app with CRUD, tags, search, and favorites.

**Architecture:** Monorepo with React+Vite frontend (`packages/client`) and NestJS backend (`packages/server`). SQLite database with Drizzle ORM for type-safe data access. REST API connects the two layers.

**Tech Stack:** TypeScript, React, Vite, NestJS, SQLite, Drizzle ORM, Jest, Vitest

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json` (root workspace config)
- Create: `tsconfig.base.json`
- Create: `packages/server/` (NestJS project)
- Create: `packages/client/` (React+Vite project)

**Step 1: Initialize root workspace**

```bash
npm init -y
```

Edit `package.json`:
```json
{
  "name": "linkvault",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:server": "npm run start:dev --workspace=packages/server",
    "dev:client": "npm run dev --workspace=packages/client",
    "test:server": "npm test --workspace=packages/server",
    "test:client": "npm test --workspace=packages/client"
  }
}
```

**Step 2: Scaffold NestJS backend**

```bash
cd packages && npx @nestjs/cli new server --package-manager npm --skip-git
```

**Step 3: Scaffold React+Vite frontend**

```bash
cd packages && npm create vite@latest client -- --template react-ts
```

**Step 4: Install dependencies from root**

```bash
cd /path/to/project && npm install
```

**Step 5: Verify both dev servers start**

```bash
npm run dev:server
# Expected: NestJS listening on port 3000
npm run dev:client
# Expected: Vite dev server on port 5173
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with NestJS backend and React+Vite frontend"
```

---

## Task 2: Database Schema with Drizzle ORM

**Files:**
- Create: `packages/server/src/database/schema.ts`
- Create: `packages/server/src/database/database.module.ts`
- Create: `packages/server/drizzle.config.ts`
- Modify: `packages/server/package.json` (add drizzle deps)

**Step 1: Install Drizzle dependencies**

```bash
npm install drizzle-orm better-sqlite3 --workspace=packages/server
npm install -D drizzle-kit @types/better-sqlite3 --workspace=packages/server
```

**Step 2: Create schema definition**

Create `packages/server/src/database/schema.ts`:
```typescript
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  title: text('title').notNull(),
  memo: text('memo').default(''),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const bookmarkTags = sqliteTable('bookmark_tags', {
  bookmarkId: integer('bookmark_id').notNull().references(() => bookmarks.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.bookmarkId, table.tagId] }),
]);

export type InsertBookmark = typeof bookmarks.$inferInsert;
export type SelectBookmark = typeof bookmarks.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;
```

**Step 3: Create Drizzle config**

Create `packages/server/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/linkvault.db',
  },
});
```

**Step 4: Create DatabaseModule as NestJS provider**

Create `packages/server/src/database/database.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => {
        const sqlite = new Database('./data/linkvault.db');
        sqlite.pragma('journal_mode = WAL');
        return drizzle(sqlite, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
```

**Step 5: Register DatabaseModule in AppModule**

Modify `packages/server/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule],
})
export class AppModule {}
```

**Step 6: Generate and run migration**

```bash
cd packages/server
mkdir -p data
npx drizzle-kit generate
npx drizzle-kit push
```

**Step 7: Commit**

```bash
git add packages/server/src/database packages/server/drizzle.config.ts packages/server/drizzle
git commit -m "feat: add Drizzle ORM schema with bookmarks, tags, and bookmark_tags tables"
```

---

## Task 3: Bookmarks CRUD - Service Layer (TDD)

**Files:**
- Create: `packages/server/src/bookmarks/bookmarks.service.ts`
- Create: `packages/server/src/bookmarks/bookmarks.service.spec.ts`
- Create: `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`
- Create: `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`

**Step 1: Write the failing test for create bookmark**

Create `packages/server/src/bookmarks/bookmarks.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { DATABASE } from '../database/database.module';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{
        id: 1,
        url: 'https://example.com',
        title: 'Example',
        memo: '',
        isFavorite: false,
        createdAt: '2026-03-09',
        updatedAt: '2026-03-09',
      }]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      all: jest.fn(),
      get: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: DATABASE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bookmark and return it', async () => {
      const dto = { url: 'https://example.com', title: 'Example' };
      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('url', 'https://example.com');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/server && npx jest --testPathPattern=bookmarks.service.spec --no-coverage
```

Expected: FAIL - Cannot find module './bookmarks.service'

**Step 3: Create DTOs**

Create `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`:
```typescript
export class CreateBookmarkDto {
  readonly url: string;
  readonly title: string;
  readonly memo?: string;
}
```

Create `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`:
```typescript
export class UpdateBookmarkDto {
  readonly url?: string;
  readonly title?: string;
  readonly memo?: string;
  readonly isFavorite?: boolean;
}
```

**Step 4: Implement BookmarksService with create method**

Create `packages/server/src/bookmarks/bookmarks.service.ts`:
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.module';
import { bookmarks } from '../database/schema';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async create(dto: CreateBookmarkDto) {
    const [bookmark] = await this.db
      .insert(bookmarks)
      .values({ url: dto.url, title: dto.title, memo: dto.memo ?? '' })
      .returning();
    return bookmark;
  }
}
```

**Step 5: Run test to verify it passes**

```bash
cd packages/server && npx jest --testPathPattern=bookmarks.service.spec --no-coverage
```

Expected: PASS

**Step 6: Add remaining CRUD tests and implementation**

Add to spec file tests for: `findAll`, `findOne`, `update`, `remove`. Implement each in service:

```typescript
// Add to BookmarksService
async findAll() {
  return this.db.select().from(bookmarks).all();
}

async findOne(id: number) {
  return this.db.select().from(bookmarks).where(eq(bookmarks.id, id)).get();
}

async update(id: number, dto: UpdateBookmarkDto) {
  const [updated] = await this.db
    .update(bookmarks)
    .set({ ...dto, updatedAt: new Date().toISOString() })
    .where(eq(bookmarks.id, id))
    .returning();
  return updated;
}

async remove(id: number) {
  await this.db.delete(bookmarks).where(eq(bookmarks.id, id));
}
```

**Step 7: Run all tests**

```bash
cd packages/server && npx jest --testPathPattern=bookmarks.service.spec --no-coverage
```

Expected: All PASS

**Step 8: Commit**

```bash
git add packages/server/src/bookmarks
git commit -m "feat: add BookmarksService with CRUD operations and unit tests"
```

---

## Task 4: Bookmarks CRUD - Controller Layer (TDD)

**Files:**
- Create: `packages/server/src/bookmarks/bookmarks.controller.ts`
- Create: `packages/server/src/bookmarks/bookmarks.controller.spec.ts`
- Create: `packages/server/src/bookmarks/bookmarks.module.ts`

**Step 1: Write the failing controller test**

Create `packages/server/src/bookmarks/bookmarks.controller.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let service: BookmarksService;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
    update: jest.fn().mockResolvedValue({ id: 1, url: 'https://updated.com', title: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [{ provide: BookmarksService, useValue: mockService }],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should create a bookmark', async () => {
    const dto = { url: 'https://example.com', title: 'Example' };
    const result = await controller.create(dto);
    expect(result).toHaveProperty('id', 1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('should return all bookmarks', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([]);
  });

  it('should return a single bookmark', async () => {
    const result = await controller.findOne(1);
    expect(result).toHaveProperty('id', 1);
  });

  it('should update a bookmark', async () => {
    const dto = { title: 'Updated' };
    const result = await controller.update(1, dto);
    expect(result).toHaveProperty('title', 'Updated');
  });

  it('should delete a bookmark', async () => {
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/server && npx jest --testPathPattern=bookmarks.controller.spec --no-coverage
```

Expected: FAIL

**Step 3: Implement BookmarksController**

Create `packages/server/src/bookmarks/bookmarks.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Controller('api/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(dto);
  }

  @Get()
  findAll() {
    return this.bookmarksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookmarksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookmarkDto) {
    return this.bookmarksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookmarksService.remove(id);
  }
}
```

**Step 4: Create BookmarksModule and register in AppModule**

Create `packages/server/src/bookmarks/bookmarks.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
```

Modify `packages/server/src/app.module.ts` to import `BookmarksModule`.

**Step 5: Run tests**

```bash
cd packages/server && npx jest --testPathPattern=bookmarks --no-coverage
```

Expected: All PASS

**Step 6: Commit**

```bash
git add packages/server/src/bookmarks packages/server/src/app.module.ts
git commit -m "feat: add BookmarksController with REST endpoints and unit tests"
```

---

## Task 5: Tags Module (TDD)

**Files:**
- Create: `packages/server/src/tags/tags.service.ts`
- Create: `packages/server/src/tags/tags.service.spec.ts`
- Create: `packages/server/src/tags/tags.controller.ts`
- Create: `packages/server/src/tags/tags.controller.spec.ts`
- Create: `packages/server/src/tags/tags.module.ts`
- Create: `packages/server/src/tags/dto/create-tag.dto.ts`

**Step 1: Write failing TagsService test**

Test cases:
- `findAll` returns all tags
- `findOrCreate` returns existing tag or creates new one

**Step 2: Run test to verify it fails**

```bash
cd packages/server && npx jest --testPathPattern=tags.service.spec --no-coverage
```

**Step 3: Implement TagsService**

```typescript
@Injectable()
export class TagsService {
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll() {
    return this.db.select().from(tags).all();
  }

  async findOrCreate(name: string) {
    const existing = await this.db
      .select().from(tags).where(eq(tags.name, name)).get();
    if (existing) return existing;
    const [tag] = await this.db.insert(tags).values({ name }).returning();
    return tag;
  }
}
```

**Step 4: Run test to verify it passes**

**Step 5: Write failing TagsController test**

**Step 6: Implement TagsController with `GET /api/tags`**

**Step 7: Create TagsModule and register in AppModule**

**Step 8: Run all tests**

```bash
cd packages/server && npx jest --no-coverage
```

**Step 9: Commit**

```bash
git add packages/server/src/tags packages/server/src/app.module.ts
git commit -m "feat: add Tags module with findAll and findOrCreate"
```

---

## Task 6: Bookmark-Tag Relationship Endpoints (TDD)

**Files:**
- Modify: `packages/server/src/bookmarks/bookmarks.service.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.service.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.controller.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.controller.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.module.ts`

**Step 1: Write failing test for addTag**

```typescript
describe('addTag', () => {
  it('should add a tag to a bookmark', async () => {
    const result = await service.addTag(1, 'typescript');
    expect(result).toHaveProperty('tagId');
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement addTag and removeTag in BookmarksService**

```typescript
async addTag(bookmarkId: number, tagName: string) {
  const tag = await this.tagsService.findOrCreate(tagName);
  await this.db.insert(bookmarkTags).values({ bookmarkId, tagId: tag.id });
  return { bookmarkId, tagId: tag.id };
}

async removeTag(bookmarkId: number, tagId: number) {
  await this.db.delete(bookmarkTags)
    .where(and(
      eq(bookmarkTags.bookmarkId, bookmarkId),
      eq(bookmarkTags.tagId, tagId),
    ));
}

async findAllWithTags() {
  // Join bookmarks with their tags
}
```

**Step 4: Run tests**

**Step 5: Add controller endpoints `POST /api/bookmarks/:id/tags` and `DELETE /api/bookmarks/:id/tags`**

**Step 6: Run all tests**

**Step 7: Commit**

```bash
git add packages/server/src/bookmarks packages/server/src/tags
git commit -m "feat: add bookmark-tag relationship endpoints"
```

---

## Task 7: Search and Favorites (TDD)

**Files:**
- Modify: `packages/server/src/bookmarks/bookmarks.service.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.service.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.controller.ts`

**Step 1: Write failing test for search**

```typescript
describe('search', () => {
  it('should filter bookmarks by search query', async () => {
    const result = await service.findAll({ search: 'example' });
    expect(mockDb.where).toHaveBeenCalled();
  });
});
```

**Step 2: Implement search with LIKE queries**

Add query params to `findAll`:
```typescript
async findAll(params?: { search?: string; tag?: string; favorite?: boolean }) {
  let query = this.db.select().from(bookmarks);

  if (params?.search) {
    query = query.where(
      or(
        like(bookmarks.title, `%${params.search}%`),
        like(bookmarks.url, `%${params.search}%`),
        like(bookmarks.memo, `%${params.search}%`),
      )
    );
  }

  if (params?.favorite) {
    query = query.where(eq(bookmarks.isFavorite, true));
  }

  return query.all();
}
```

**Step 3: Write failing test for toggle favorite**

**Step 4: Implement toggle favorite via `PUT /api/bookmarks/:id` with `{ isFavorite: true }`**

**Step 5: Update controller to accept query params**

```typescript
@Get()
findAll(
  @Query('search') search?: string,
  @Query('tag') tag?: string,
  @Query('favorite') favorite?: string,
) {
  return this.bookmarksService.findAll({
    search,
    tag,
    favorite: favorite === 'true',
  });
}
```

**Step 6: Run all backend tests**

```bash
cd packages/server && npx jest --no-coverage
```

**Step 7: Commit**

```bash
git add packages/server/src/bookmarks
git commit -m "feat: add search and favorites filtering to bookmarks"
```

---

## Task 8: Input Validation

**Files:**
- Modify: `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`
- Modify: `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`
- Modify: `packages/server/src/main.ts`

**Step 1: Install class-validator and class-transformer**

```bash
npm install class-validator class-transformer --workspace=packages/server
```

**Step 2: Add validation decorators to DTOs**

```typescript
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateBookmarkDto {
  @IsUrl()
  readonly url: string;

  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly memo?: string;
}
```

**Step 3: Enable global validation pipe in main.ts**

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

**Step 4: Commit**

```bash
git add packages/server/src
git commit -m "feat: add input validation with class-validator"
```

---

## Task 9: Frontend - Project Setup and API Client

**Files:**
- Create: `packages/client/src/api/bookmarks.ts`
- Create: `packages/client/src/api/tags.ts`
- Create: `packages/client/src/types/bookmark.ts`
- Modify: `packages/client/package.json`

**Step 1: Install dependencies**

```bash
npm install axios --workspace=packages/client
```

**Step 2: Create shared types**

Create `packages/client/src/types/bookmark.ts`:
```typescript
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
```

**Step 3: Create API client modules**

```typescript
// packages/client/src/api/bookmarks.ts
import axios from 'axios';
import { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from '../types/bookmark';

const API_BASE = '/api/bookmarks';

export const bookmarksApi = {
  getAll: (params?: { search?: string; tag?: string; favorite?: boolean }) =>
    axios.get<Bookmark[]>(API_BASE, { params }).then(r => r.data),

  getById: (id: number) =>
    axios.get<Bookmark>(`${API_BASE}/${id}`).then(r => r.data),

  create: (input: CreateBookmarkInput) =>
    axios.post<Bookmark>(API_BASE, input).then(r => r.data),

  update: (id: number, input: UpdateBookmarkInput) =>
    axios.put<Bookmark>(`${API_BASE}/${id}`, input).then(r => r.data),

  remove: (id: number) =>
    axios.delete(`${API_BASE}/${id}`),

  addTag: (id: number, tagName: string) =>
    axios.post(`${API_BASE}/${id}/tags`, { name: tagName }).then(r => r.data),

  removeTag: (id: number, tagId: number) =>
    axios.delete(`${API_BASE}/${id}/tags`, { data: { tagId } }),
};
```

**Step 4: Configure Vite proxy**

Modify `packages/client/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

**Step 5: Commit**

```bash
git add packages/client/src/api packages/client/src/types packages/client/vite.config.ts
git commit -m "feat: add API client and types for frontend"
```

---

## Task 10: Frontend - Bookmark List Component

**Files:**
- Create: `packages/client/src/components/BookmarkList.tsx`
- Create: `packages/client/src/components/BookmarkCard.tsx`
- Create: `packages/client/src/hooks/useBookmarks.ts`
- Modify: `packages/client/src/App.tsx`

**Step 1: Create useBookmarks hook**

```typescript
// packages/client/src/hooks/useBookmarks.ts
import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/bookmarks';
import { Bookmark } from '../types/bookmark';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (params?: { search?: string; tag?: string; favorite?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarksApi.getAll(params);
      setBookmarks(data);
    } catch (e) {
      setError('Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  return { bookmarks, loading, error, refetch: fetchBookmarks };
}
```

**Step 2: Create BookmarkCard component**

Displays: title, URL, memo, favorite toggle, tags, delete button.

**Step 3: Create BookmarkList component**

Lists BookmarkCards with loading/error states.

**Step 4: Wire up in App.tsx**

**Step 5: Commit**

```bash
git add packages/client/src
git commit -m "feat: add BookmarkList and BookmarkCard components"
```

---

## Task 11: Frontend - Create/Edit Bookmark Form

**Files:**
- Create: `packages/client/src/components/BookmarkForm.tsx`
- Modify: `packages/client/src/App.tsx`

**Step 1: Create BookmarkForm component**

Form with: URL input, Title input, Memo textarea, Submit button.
Validates URL is not empty. Calls `bookmarksApi.create()` on submit.

**Step 2: Integrate form in App.tsx**

**Step 3: Commit**

```bash
git add packages/client/src
git commit -m "feat: add BookmarkForm component for creating bookmarks"
```

---

## Task 12: Frontend - Search and Filter

**Files:**
- Create: `packages/client/src/components/SearchBar.tsx`
- Create: `packages/client/src/components/TagFilter.tsx`
- Modify: `packages/client/src/App.tsx`

**Step 1: Create SearchBar component**

Text input with debounced search. Calls `refetch({ search })`.

**Step 2: Create TagFilter component**

Shows tag list. Clicking a tag filters bookmarks by that tag.

**Step 3: Add favorites-only toggle**

**Step 4: Wire up in App.tsx**

**Step 5: Commit**

```bash
git add packages/client/src
git commit -m "feat: add search bar, tag filter, and favorites toggle"
```

---

## Task 13: Styling and Polish

**Files:**
- Create: `packages/client/src/styles/` (CSS modules or global styles)
- Modify: various component files

**Step 1: Add basic CSS for layout**

Clean, minimal design: card layout, responsive grid, hover effects.

**Step 2: Add loading spinners and empty states**

**Step 3: Commit**

```bash
git add packages/client/src
git commit -m "feat: add styling and UI polish"
```

---

## Task 14: E2E Verification

**Step 1: Start both servers**

```bash
npm run dev:server &
npm run dev:client &
```

**Step 2: Manual verification checklist**

- [ ] Create a bookmark
- [ ] View bookmark list
- [ ] Edit a bookmark
- [ ] Delete a bookmark
- [ ] Add/remove tags
- [ ] Search by title
- [ ] Toggle favorite
- [ ] Filter by favorites only

**Step 3: Run all tests**

```bash
npm run test:server
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
