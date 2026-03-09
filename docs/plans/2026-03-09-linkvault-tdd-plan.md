# LinkVault TDD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bookmark management web app with CRUD, tags, search, and favorites using strict TDD.

**Architecture:** Monorepo with React+Vite frontend (`packages/client`) and NestJS backend (`packages/server`). SQLite database with Drizzle ORM. Every feature is test-first: RED (failing test) -> GREEN (minimal implementation) -> REFACTOR -> commit.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, @testing-library/react, jsdom, NestJS, Jest, SQLite, Drizzle ORM, class-validator

**Worktree:** `/Users/merry.lee/projects/minzzang/linkvault` (branch: `feature/linkvault`)

---

## Phase 1: Scaffolding

### Task 1: Monorepo + NestJS + React Scaffold

**Files:**
- Create: `package.json`
- Create: `packages/server/` (via NestJS CLI)
- Create: `packages/client/` (via Vite CLI)

**Step 1: Initialize root workspace**

```bash
cd /Users/merry.lee/projects/minzzang/linkvault
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
    "test:client": "npm test --workspace=packages/client",
    "test": "npm run test:server && npm run test:client"
  }
}
```

**Step 2: Scaffold NestJS**

```bash
cd packages && npx @nestjs/cli new server --package-manager npm --skip-git --skip-install
```

**Step 3: Scaffold React+Vite**

```bash
cd packages && npm create vite@latest client -- --template react-ts
```

**Step 4: Install all dependencies**

```bash
cd /Users/merry.lee/projects/minzzang/linkvault && npm install
```

**Step 5: Verify NestJS tests pass**

Run: `npm test --workspace=packages/server`
Expected: PASS (default NestJS tests)

**Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold monorepo with NestJS backend and React+Vite frontend"
```

---

### Task 2: Frontend Test Infrastructure

**Files:**
- Modify: `packages/client/package.json`
- Create: `packages/client/vitest.config.ts`
- Create: `packages/client/src/test-utils.tsx`

**Step 1: Install test dependencies**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event --workspace=packages/client
```

**Step 2: Create vitest config**

Create `packages/client/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-utils.tsx',
    css: false,
  },
});
```

**Step 3: Create test setup and utilities**

Create `packages/client/src/test-utils.tsx`:
```typescript
import '@testing-library/jest-dom/vitest';
```

**Step 4: Add test script to client package.json**

Add to `packages/client/package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 5: Write a smoke test to verify setup**

Create `packages/client/src/App.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });
});
```

**Step 6: Run test**

Run: `npm test --workspace=packages/client`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/client && git commit -m "chore: add Vitest + React Testing Library test infrastructure"
```

---

### Task 3: Database Schema with Drizzle ORM

**Files:**
- Create: `packages/server/src/database/schema.ts`
- Create: `packages/server/src/database/database.module.ts`
- Create: `packages/server/drizzle.config.ts`

**Step 1: Install Drizzle dependencies**

```bash
npm install drizzle-orm better-sqlite3 --workspace=packages/server
npm install -D drizzle-kit @types/better-sqlite3 --workspace=packages/server
```

**Step 2: Create schema**

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

**Step 3: Create DatabaseModule**

Create `packages/server/src/database/database.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');
export type DrizzleDB = BetterSQLite3Database<typeof schema>;

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

**Step 4: Create drizzle config**

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

**Step 5: Register in AppModule**

Replace `packages/server/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule],
})
export class AppModule {}
```

Remove the default `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts` since we're replacing them.

**Step 6: Generate migration and push**

```bash
cd packages/server && mkdir -p data && npx drizzle-kit push
```

**Step 7: Add `data/` to .gitignore**

Append to root `.gitignore`:
```
# Database
data/
```

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Drizzle ORM schema with bookmarks, tags, bookmark_tags tables"
```

---

## Phase 2: Backend (TDD)

### Task 4: BookmarksService - create (RED -> GREEN)

**Files:**
- Create: `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`
- Create: `packages/server/src/bookmarks/bookmarks.service.ts`
- Test: `packages/server/src/bookmarks/bookmarks.service.spec.ts`

**Step 1: Write the failing test (RED)**

Create `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`:
```typescript
export class CreateBookmarkDto {
  readonly url: string;
  readonly title: string;
  readonly memo?: string;
}
```

Create `packages/server/src/bookmarks/bookmarks.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { DATABASE } from '../database/database.module';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let mockDb: Record<string, jest.Mock>;

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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: DATABASE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  describe('create', () => {
    it('should insert a bookmark and return it', async () => {
      const dto = { url: 'https://example.com', title: 'Example' };
      const result = await service.create(dto);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        url: 'https://example.com',
        title: 'Example',
      }));
    });

    it('should use empty string for memo when not provided', async () => {
      const dto = { url: 'https://example.com', title: 'Example' };
      await service.create(dto);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ memo: '' }),
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest --testPathPattern=bookmarks.service.spec --no-coverage --workspace=packages/server`
Expected: FAIL - Cannot find module './bookmarks.service'

**Step 3: Write minimal implementation (GREEN)**

Create `packages/server/src/bookmarks/bookmarks.service.ts`:
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, DrizzleDB } from '../database/database.module';
import { bookmarks } from '../database/schema';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(dto: CreateBookmarkDto) {
    const [bookmark] = await this.db
      .insert(bookmarks)
      .values({ url: dto.url, title: dto.title, memo: dto.memo ?? '' })
      .returning();
    return bookmark;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest --testPathPattern=bookmarks.service.spec --no-coverage --workspace=packages/server`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add packages/server/src/bookmarks && git commit -m "feat: add BookmarksService.create with TDD"
```

---

### Task 5: BookmarksService - findAll, findOne, update, remove (RED -> GREEN)

**Files:**
- Modify: `packages/server/src/bookmarks/bookmarks.service.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.service.ts`
- Create: `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`

**Step 1: Write failing tests (RED)**

Create `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`:
```typescript
export class UpdateBookmarkDto {
  readonly url?: string;
  readonly title?: string;
  readonly memo?: string;
  readonly isFavorite?: boolean;
}
```

Add to `bookmarks.service.spec.ts` beforeEach mockDb:
```typescript
    mockDb = {
      // ...existing mocks
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      all: jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example', memo: '', isFavorite: false },
      ]),
      get: jest.fn().mockResolvedValue(
        { id: 1, url: 'https://example.com', title: 'Example', memo: '', isFavorite: false },
      ),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
```

Add test cases:
```typescript
  describe('findAll', () => {
    it('should return all bookmarks', async () => {
      const result = await service.findAll();
      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a single bookmark by id', async () => {
      const result = await service.findOne(1);
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('update', () => {
    it('should update and return the bookmark', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, url: 'https://updated.com', title: 'Updated', memo: '', isFavorite: false },
      ]);
      const result = await service.update(1, { title: 'Updated' });
      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toHaveProperty('title', 'Updated');
    });
  });

  describe('remove', () => {
    it('should delete a bookmark', async () => {
      await service.remove(1);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });
```

**Step 2: Run tests - should FAIL**

Run: `npm test --workspace=packages/server`
Expected: FAIL - service.findAll is not a function

**Step 3: Implement (GREEN)**

Add to `bookmarks.service.ts`:
```typescript
import { eq } from 'drizzle-orm';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

// Add methods to BookmarksService class:

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

**Step 4: Run tests - should PASS**

Run: `npm test --workspace=packages/server`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add packages/server/src/bookmarks && git commit -m "feat: add BookmarksService findAll/findOne/update/remove with TDD"
```

---

### Task 6: BookmarksController (RED -> GREEN)

**Files:**
- Create: `packages/server/src/bookmarks/bookmarks.controller.ts`
- Create: `packages/server/src/bookmarks/bookmarks.controller.spec.ts`
- Create: `packages/server/src/bookmarks/bookmarks.module.ts`

**Step 1: Write failing test (RED)**

Create `packages/server/src/bookmarks/bookmarks.controller.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
    findAll: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Example' }]),
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
    jest.clearAllMocks();
  });

  it('POST /api/bookmarks - should create a bookmark', async () => {
    const dto = { url: 'https://example.com', title: 'Example' };
    const result = await controller.create(dto);
    expect(result).toHaveProperty('id', 1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('GET /api/bookmarks - should return all bookmarks', async () => {
    const result = await controller.findAll(undefined, undefined, undefined);
    expect(result).toHaveLength(1);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('GET /api/bookmarks/:id - should return one bookmark', async () => {
    const result = await controller.findOne(1);
    expect(result).toHaveProperty('id', 1);
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('PUT /api/bookmarks/:id - should update a bookmark', async () => {
    const dto = { title: 'Updated' };
    const result = await controller.update(1, dto);
    expect(result).toHaveProperty('title', 'Updated');
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('DELETE /api/bookmarks/:id - should delete a bookmark', async () => {
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
```

**Step 2: Run test - should FAIL**

Run: `npm test --workspace=packages/server`
Expected: FAIL - Cannot find module './bookmarks.controller'

**Step 3: Implement (GREEN)**

Create `packages/server/src/bookmarks/bookmarks.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
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

Register in `packages/server/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
  imports: [DatabaseModule, BookmarksModule],
})
export class AppModule {}
```

**Step 4: Run tests - should PASS**

Run: `npm test --workspace=packages/server`
Expected: PASS (all bookmarks tests)

**Step 5: Commit**

```bash
git add packages/server/src && git commit -m "feat: add BookmarksController with REST endpoints via TDD"
```

---

### Task 7: TagsService (RED -> GREEN)

**Files:**
- Create: `packages/server/src/tags/tags.service.ts`
- Test: `packages/server/src/tags/tags.service.spec.ts`

**Step 1: Write failing tests (RED)**

Create `packages/server/src/tags/tags.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { DATABASE } from '../database/database.module';

describe('TagsService', () => {
  let service: TagsService;
  let mockDb: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      all: jest.fn().mockResolvedValue([
        { id: 1, name: 'typescript' },
        { id: 2, name: 'react' },
      ]),
      get: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 3, name: 'new-tag' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: DATABASE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'typescript');
    });
  });

  describe('findOrCreate', () => {
    it('should return existing tag if found', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 1, name: 'typescript' });
      const result = await service.findOrCreate('typescript');
      expect(result).toHaveProperty('id', 1);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should create and return new tag if not found', async () => {
      mockDb.get.mockResolvedValueOnce(undefined);
      const result = await service.findOrCreate('new-tag');
      expect(result).toHaveProperty('id', 3);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test - should FAIL**

Expected: FAIL - Cannot find module './tags.service'

**Step 3: Implement (GREEN)**

Create `packages/server/src/tags/tags.service.ts`:
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, DrizzleDB } from '../database/database.module';
import { tags } from '../database/schema';

@Injectable()
export class TagsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findAll() {
    return this.db.select().from(tags).all();
  }

  async findOrCreate(name: string) {
    const existing = await this.db
      .select()
      .from(tags)
      .where(eq(tags.name, name))
      .get();
    if (existing) return existing;
    const [tag] = await this.db.insert(tags).values({ name }).returning();
    return tag;
  }
}
```

**Step 4: Run tests - should PASS**

Run: `npm test --workspace=packages/server`
Expected: PASS (3 new tests)

**Step 5: Commit**

```bash
git add packages/server/src/tags && git commit -m "feat: add TagsService with findAll and findOrCreate via TDD"
```

---

### Task 8: TagsController + TagsModule (RED -> GREEN)

**Files:**
- Create: `packages/server/src/tags/tags.controller.ts`
- Create: `packages/server/src/tags/tags.controller.spec.ts`
- Create: `packages/server/src/tags/tags.module.ts`
- Modify: `packages/server/src/app.module.ts`

**Step 1: Write failing test (RED)**

Create `packages/server/src/tags/tags.controller.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  let controller: TagsController;

  const mockService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'typescript' },
      { id: 2, name: 'react' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: mockService }],
    }).compile();

    controller = module.get<TagsController>(TagsController);
  });

  it('GET /api/tags - should return all tags', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(2);
    expect(mockService.findAll).toHaveBeenCalled();
  });
});
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/server/src/tags/tags.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('api/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }
}
```

Create `packages/server/src/tags/tags.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
```

Update `packages/server/src/app.module.ts` to import TagsModule.

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/server/src && git commit -m "feat: add TagsController and TagsModule via TDD"
```

---

### Task 9: Bookmark-Tag Relationships (RED -> GREEN)

**Files:**
- Modify: `packages/server/src/bookmarks/bookmarks.service.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.service.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.controller.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.controller.spec.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.module.ts`

**Step 1: Write failing tests for addTag/removeTag (RED)**

Add to `bookmarks.service.spec.ts`:
```typescript
// Add TagsService mock to providers:
const mockTagsService = {
  findOrCreate: jest.fn().mockResolvedValue({ id: 1, name: 'typescript' }),
};

// In TestingModule providers:
{ provide: TagsService, useValue: mockTagsService },

// New test cases:
describe('addTag', () => {
  it('should find or create tag and link it to bookmark', async () => {
    const result = await service.addTag(1, 'typescript');
    expect(mockTagsService.findOrCreate).toHaveBeenCalledWith('typescript');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toEqual({ bookmarkId: 1, tagId: 1 });
  });
});

describe('removeTag', () => {
  it('should delete the bookmark-tag relationship', async () => {
    await service.removeTag(1, 1);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
```

Add to `bookmarks.controller.spec.ts`:
```typescript
// Add to mockService:
addTag: jest.fn().mockResolvedValue({ bookmarkId: 1, tagId: 1 }),
removeTag: jest.fn().mockResolvedValue(undefined),

// New tests:
it('POST /api/bookmarks/:id/tags - should add a tag', async () => {
  const result = await controller.addTag(1, { name: 'typescript' });
  expect(result).toEqual({ bookmarkId: 1, tagId: 1 });
  expect(mockService.addTag).toHaveBeenCalledWith(1, 'typescript');
});

it('DELETE /api/bookmarks/:id/tags - should remove a tag', async () => {
  await controller.removeTag(1, { tagId: 1 });
  expect(mockService.removeTag).toHaveBeenCalledWith(1, 1);
});
```

**Step 2: Run tests - should FAIL**

**Step 3: Implement (GREEN)**

Add to `BookmarksService`:
```typescript
import { and } from 'drizzle-orm';
import { bookmarkTags } from '../database/schema';
import { TagsService } from '../tags/tags.service';

// Add constructor param:
constructor(
  @Inject(DATABASE) private readonly db: DrizzleDB,
  private readonly tagsService: TagsService,
) {}

async addTag(bookmarkId: number, tagName: string) {
  const tag = await this.tagsService.findOrCreate(tagName);
  await this.db.insert(bookmarkTags).values({ bookmarkId, tagId: tag.id });
  return { bookmarkId, tagId: tag.id };
}

async removeTag(bookmarkId: number, tagId: number) {
  await this.db.delete(bookmarkTags).where(
    and(
      eq(bookmarkTags.bookmarkId, bookmarkId),
      eq(bookmarkTags.tagId, tagId),
    ),
  );
}
```

Add controller endpoints:
```typescript
@Post(':id/tags')
addTag(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
  return this.bookmarksService.addTag(id, body.name);
}

@Delete(':id/tags')
removeTag(@Param('id', ParseIntPipe) id: number, @Body() body: { tagId: number }) {
  return this.bookmarksService.removeTag(id, body.tagId);
}
```

Import TagsModule in BookmarksModule.

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/server/src && git commit -m "feat: add bookmark-tag relationship endpoints via TDD"
```

---

### Task 10: Search & Favorites (RED -> GREEN)

**Files:**
- Modify: `packages/server/src/bookmarks/bookmarks.service.ts`
- Modify: `packages/server/src/bookmarks/bookmarks.service.spec.ts`

**Step 1: Write failing tests (RED)**

Add to `bookmarks.service.spec.ts`:
```typescript
describe('findAll with filters', () => {
  it('should apply search filter with LIKE', async () => {
    await service.findAll({ search: 'example' });
    expect(mockDb.where).toHaveBeenCalled();
  });

  it('should apply favorite filter', async () => {
    await service.findAll({ favorite: true });
    expect(mockDb.where).toHaveBeenCalled();
  });

  it('should return all when no filters', async () => {
    await service.findAll();
    expect(mockDb.select).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests - should FAIL**

**Step 3: Implement (GREEN)**

Update `BookmarksService.findAll`:
```typescript
import { and, eq, like, or, type SQL } from 'drizzle-orm';

interface FindAllParams {
  search?: string;
  tag?: string;
  favorite?: boolean;
}

async findAll(params?: FindAllParams) {
  let query = this.db.select().from(bookmarks);
  const conditions: SQL[] = [];

  if (params?.search) {
    const searchCondition = or(
      like(bookmarks.title, `%${params.search}%`),
      like(bookmarks.url, `%${params.search}%`),
      like(bookmarks.memo, `%${params.search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (params?.favorite) {
    conditions.push(eq(bookmarks.isFavorite, true));
  }

  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1 ? conditions[0] : and(...conditions),
    );
  }

  return query.all();
}
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/server/src/bookmarks && git commit -m "feat: add search and favorites filtering via TDD"
```

---

### Task 11: Input Validation

**Files:**
- Modify: `packages/server/src/bookmarks/dto/create-bookmark.dto.ts`
- Modify: `packages/server/src/bookmarks/dto/update-bookmark.dto.ts`
- Modify: `packages/server/src/main.ts`

**Step 1: Install dependencies**

```bash
npm install class-validator class-transformer --workspace=packages/server
```

**Step 2: Add validation decorators**

Update `create-bookmark.dto.ts`:
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

Update `update-bookmark.dto.ts`:
```typescript
import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBookmarkDto {
  @IsOptional()
  @IsUrl()
  readonly url?: string;

  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly memo?: string;

  @IsOptional()
  @IsBoolean()
  readonly isFavorite?: boolean;
}
```

**Step 3: Enable global validation pipe**

Update `packages/server/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

**Step 4: Run all backend tests**

Run: `npm test --workspace=packages/server`
Expected: All PASS

**Step 5: TypeScript check**

Run: `cd packages/server && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/server/src && git commit -m "feat: add input validation with class-validator"
```

---

## Phase 3: Frontend (TDD)

### Task 12: Types and API Client

**Files:**
- Create: `packages/client/src/types/bookmark.ts`
- Create: `packages/client/src/api/bookmarks.ts`
- Create: `packages/client/src/api/bookmarks.test.ts`

**Step 1: Install axios**

```bash
npm install axios --workspace=packages/client
```

**Step 2: Create types**

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

**Step 3: Write failing test for API client (RED)**

Create `packages/client/src/api/bookmarks.test.ts`:
```typescript
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
```

**Step 4: Run test - should FAIL**

Run: `npm test --workspace=packages/client`
Expected: FAIL - Cannot find module './bookmarks'

**Step 5: Implement (GREEN)**

Create `packages/client/src/api/bookmarks.ts`:
```typescript
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
```

**Step 6: Configure Vite proxy**

Update `packages/client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

**Step 7: Run tests - should PASS**

Run: `npm test --workspace=packages/client`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/client/src && git commit -m "feat: add TypeScript types and API client with TDD"
```

---

### Task 13: BookmarkCard Component (RED -> GREEN)

**Files:**
- Create: `packages/client/src/components/BookmarkCard.tsx`
- Test: `packages/client/src/components/BookmarkCard.test.tsx`

**Step 1: Write failing test (RED)**

Create `packages/client/src/components/BookmarkCard.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark } from '../types/bookmark';

const mockBookmark: Bookmark = {
  id: 1,
  url: 'https://example.com',
  title: 'Example Site',
  memo: 'A test bookmark',
  isFavorite: false,
  createdAt: '2026-03-09',
  updatedAt: '2026-03-09',
  tags: [{ id: 1, name: 'test' }],
};

describe('BookmarkCard', () => {
  it('renders bookmark title and URL', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders memo', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('A test bookmark')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
      />,
    );
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={onDelete}
        onToggleFavorite={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('calls onToggleFavorite when favorite button clicked', async () => {
    const onToggleFavorite = vi.fn();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onDelete={vi.fn()}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith(1, true);
  });
});
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/components/BookmarkCard.tsx`:
```typescript
import type { Bookmark } from '../types/bookmark';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
}

export function BookmarkCard({ bookmark, onDelete, onToggleFavorite }: BookmarkCardProps) {
  return (
    <article className="bookmark-card">
      <div className="bookmark-card-header">
        <h3>{bookmark.title}</h3>
        <div className="bookmark-card-actions">
          <button
            aria-label="favorite"
            onClick={() => onToggleFavorite(bookmark.id, !bookmark.isFavorite)}
          >
            {bookmark.isFavorite ? '★' : '☆'}
          </button>
          <button
            aria-label="delete"
            onClick={() => onDelete(bookmark.id)}
          >
            ✕
          </button>
        </div>
      </div>
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.url}
      </a>
      {bookmark.memo && <p className="bookmark-memo">{bookmark.memo}</p>}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="bookmark-tags">
          {bookmark.tags.map((tag) => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}
    </article>
  );
}
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/components && git commit -m "feat: add BookmarkCard component via TDD"
```

---

### Task 14: BookmarkList Component (RED -> GREEN)

**Files:**
- Create: `packages/client/src/components/BookmarkList.tsx`
- Test: `packages/client/src/components/BookmarkList.test.tsx`

**Step 1: Write failing test (RED)**

Create `packages/client/src/components/BookmarkList.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkList } from './BookmarkList';
import type { Bookmark } from '../types/bookmark';

const mockBookmarks: Bookmark[] = [
  { id: 1, url: 'https://a.com', title: 'Site A', memo: '', isFavorite: false, createdAt: '', updatedAt: '', tags: [] },
  { id: 2, url: 'https://b.com', title: 'Site B', memo: '', isFavorite: true, createdAt: '', updatedAt: '', tags: [] },
];

describe('BookmarkList', () => {
  it('renders loading state', () => {
    render(<BookmarkList bookmarks={[]} loading={true} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<BookmarkList bookmarks={[]} loading={false} error="Failed" onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<BookmarkList bookmarks={[]} loading={false} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText(/no bookmarks/i)).toBeInTheDocument();
  });

  it('renders list of bookmarks', () => {
    render(<BookmarkList bookmarks={mockBookmarks} loading={false} error={null} onDelete={vi.fn()} onToggleFavorite={vi.fn()} />);
    expect(screen.getByText('Site A')).toBeInTheDocument();
    expect(screen.getByText('Site B')).toBeInTheDocument();
  });
});
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/components/BookmarkList.tsx`:
```typescript
import type { Bookmark } from '../types/bookmark';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
}

export function BookmarkList({ bookmarks, loading, error, onDelete, onToggleFavorite }: BookmarkListProps) {
  if (loading) return <div className="status">Loading...</div>;
  if (error) return <div className="status error">{error}</div>;
  if (bookmarks.length === 0) return <div className="status">No bookmarks yet</div>;

  return (
    <div className="bookmark-list">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/components && git commit -m "feat: add BookmarkList component via TDD"
```

---

### Task 15: BookmarkForm Component (RED -> GREEN)

**Files:**
- Create: `packages/client/src/components/BookmarkForm.tsx`
- Test: `packages/client/src/components/BookmarkForm.test.tsx`

**Step 1: Write failing test (RED)**

Create `packages/client/src/components/BookmarkForm.test.tsx`:
```typescript
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
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/components/BookmarkForm.tsx`:
```typescript
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
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/components && git commit -m "feat: add BookmarkForm component via TDD"
```

---

### Task 16: SearchBar Component (RED -> GREEN)

**Files:**
- Create: `packages/client/src/components/SearchBar.tsx`
- Test: `packages/client/src/components/SearchBar.test.tsx`

**Step 1: Write failing test (RED)**

Create `packages/client/src/components/SearchBar.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onSearch after debounce delay', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(
      screen.getByPlaceholderText(/search/i),
      'test',
    );

    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/components/SearchBar.tsx`:
```typescript
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
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/components && git commit -m "feat: add SearchBar component with debounce via TDD"
```

---

### Task 17: TagFilter and FavoritesToggle (RED -> GREEN)

**Files:**
- Create: `packages/client/src/components/TagFilter.tsx`
- Create: `packages/client/src/components/FavoritesToggle.tsx`
- Test: `packages/client/src/components/TagFilter.test.tsx`
- Test: `packages/client/src/components/FavoritesToggle.test.tsx`

**Step 1: Write failing tests (RED)**

Create `packages/client/src/components/TagFilter.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TagFilter } from './TagFilter';

describe('TagFilter', () => {
  const tags = [
    { id: 1, name: 'react' },
    { id: 2, name: 'typescript' },
  ];

  it('renders tag buttons', () => {
    render(<TagFilter tags={tags} activeTag={null} onSelectTag={vi.fn()} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('calls onSelectTag when tag clicked', async () => {
    const onSelectTag = vi.fn();
    render(<TagFilter tags={tags} activeTag={null} onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByText('react'));
    expect(onSelectTag).toHaveBeenCalledWith('react');
  });

  it('calls onSelectTag with null when active tag clicked again', async () => {
    const onSelectTag = vi.fn();
    render(<TagFilter tags={tags} activeTag="react" onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByText('react'));
    expect(onSelectTag).toHaveBeenCalledWith(null);
  });
});
```

Create `packages/client/src/components/FavoritesToggle.test.tsx`:
```typescript
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
```

**Step 2: Run tests - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/components/TagFilter.tsx`:
```typescript
import type { Tag } from '../types/bookmark';

interface TagFilterProps {
  tags: Tag[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilter({ tags, activeTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="tag-filter">
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-btn ${activeTag === tag.name ? 'active' : ''}`}
          onClick={() => onSelectTag(activeTag === tag.name ? null : tag.name)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
```

Create `packages/client/src/components/FavoritesToggle.tsx`:
```typescript
interface FavoritesToggleProps {
  active: boolean;
  onToggle: (active: boolean) => void;
}

export function FavoritesToggle({ active, onToggle }: FavoritesToggleProps) {
  return (
    <button
      className={`favorites-toggle ${active ? 'active' : ''}`}
      aria-label="favorites"
      onClick={() => onToggle(!active)}
    >
      {active ? '★ Favorites' : '☆ Favorites'}
    </button>
  );
}
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/components && git commit -m "feat: add TagFilter and FavoritesToggle components via TDD"
```

---

### Task 18: useBookmarks Hook (RED -> GREEN)

**Files:**
- Create: `packages/client/src/hooks/useBookmarks.ts`
- Test: `packages/client/src/hooks/useBookmarks.test.ts`

**Step 1: Write failing test (RED)**

Create `packages/client/src/hooks/useBookmarks.test.ts`:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBookmarks } from './useBookmarks';
import { bookmarksApi } from '../api/bookmarks';

vi.mock('../api/bookmarks');
const mockedApi = vi.mocked(bookmarksApi);

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches bookmarks on mount', async () => {
    const data = [{ id: 1, url: 'https://a.com', title: 'A', memo: '', isFavorite: false, createdAt: '', updatedAt: '' }];
    mockedApi.getAll.mockResolvedValueOnce(data);

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookmarks).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockedApi.getAll.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch bookmarks');
    expect(result.current.bookmarks).toEqual([]);
  });
});
```

**Step 2: Run test - should FAIL**

**Step 3: Implement (GREEN)**

Create `packages/client/src/hooks/useBookmarks.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/bookmarks';
import type { Bookmark } from '../types/bookmark';

interface UseBookmarksParams {
  search?: string;
  tag?: string;
  favorite?: boolean;
}

export function useBookmarks(params?: UseBookmarksParams) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarksApi.getAll(params);
      setBookmarks(data);
    } catch {
      setError('Failed to fetch bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.tag, params?.favorite]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { bookmarks, loading, error, refetch: fetchBookmarks };
}
```

**Step 4: Run tests - should PASS**

**Step 5: Commit**

```bash
git add packages/client/src/hooks && git commit -m "feat: add useBookmarks hook via TDD"
```

---

### Task 19: App Integration and Styling

**Files:**
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/App.css`
- Modify: `packages/client/src/App.test.tsx`

**Step 1: Update App test**

Update `packages/client/src/App.test.tsx`:
```typescript
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
```

**Step 2: Run test - should FAIL**

**Step 3: Implement App.tsx**

Replace `packages/client/src/App.tsx`:
```typescript
import { useState, useCallback } from 'react';
import { useBookmarks } from './hooks/useBookmarks';
import { bookmarksApi } from './api/bookmarks';
import { BookmarkForm } from './components/BookmarkForm';
import { BookmarkList } from './components/BookmarkList';
import { SearchBar } from './components/SearchBar';
import { FavoritesToggle } from './components/FavoritesToggle';
import type { CreateBookmarkInput, Tag } from './types/bookmark';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const { bookmarks, loading, error, refetch } = useBookmarks({
    search: search || undefined,
    favorite: favoriteOnly || undefined,
  });

  const handleCreate = useCallback(async (input: CreateBookmarkInput) => {
    await bookmarksApi.create(input);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async (id: number) => {
    await bookmarksApi.remove(id);
    refetch();
  }, [refetch]);

  const handleToggleFavorite = useCallback(async (id: number, isFavorite: boolean) => {
    await bookmarksApi.update(id, { isFavorite });
    refetch();
  }, [refetch]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>LinkVault</h1>
      </header>
      <main className="app-main">
        <BookmarkForm onSubmit={handleCreate} />
        <div className="filters">
          <SearchBar onSearch={setSearch} />
          <FavoritesToggle active={favoriteOnly} onToggle={setFavoriteOnly} />
        </div>
        <BookmarkList
          bookmarks={bookmarks}
          loading={loading}
          error={error}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      </main>
    </div>
  );
}

export default App;
```

**Step 4: Add CSS**

Replace `packages/client/src/App.css` with clean, minimal styles for card grid layout, responsive design, form styling, loading/error/empty states.

**Step 5: Run all frontend tests**

Run: `npm test --workspace=packages/client`
Expected: All PASS

**Step 6: TypeScript check**

Run: `cd packages/client && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add packages/client/src && git commit -m "feat: integrate all components in App with styling"
```

---

## Phase 4: Verification

### Task 20: Full Verification

**Step 1: Run ALL tests**

```bash
npm test
```

Expected: All backend tests (Jest) + all frontend tests (Vitest) PASS.

**Step 2: TypeScript check both packages**

```bash
cd packages/server && npx tsc --noEmit
cd packages/client && npx tsc --noEmit
```

Expected: No errors in either package.

**Step 3: Start servers and manual verification**

```bash
npm run dev:server &
npm run dev:client &
```

Checklist:
- [ ] Create a bookmark (POST)
- [ ] View bookmark list (GET)
- [ ] Edit a bookmark (PUT)
- [ ] Delete a bookmark (DELETE)
- [ ] Add/remove tags
- [ ] Search by text
- [ ] Toggle favorite
- [ ] Filter favorites only

**Step 4: Final commit**

```bash
git add -A && git commit -m "chore: final verification complete"
```

---

## Agent Assignment Guide

For parallel agent team execution:

| Agent | Tasks | Directory Focus |
|-------|-------|-----------------|
| team-lead | Task 1, 3, 20 | Root setup, DB, verification |
| backend | Tasks 4-11 | `packages/server/src/` only |
| frontend | Tasks 12-19 | `packages/client/src/` only |

**Dependencies:**
- Task 1 blocks everything
- Tasks 2-3 block both backend and frontend
- Backend tasks 4-11 are sequential (each builds on previous)
- Frontend tasks 12-19 are sequential (each builds on previous)
- Backend and frontend tracks are independent of each other after Task 3
- Task 20 requires both tracks complete

**Critical rule:** Each agent MUST use @superpowers:test-driven-development skill. Write test FIRST, verify it FAILS, then implement.
