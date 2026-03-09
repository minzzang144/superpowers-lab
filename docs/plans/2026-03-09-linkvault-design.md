# LinkVault - Bookmark Management App Design

## Overview

A bookmark/link management web app for testing superpowers skills and Claude Code agent team workflows.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: SQLite + Drizzle ORM
- **Structure**: Monorepo with `packages/client` and `packages/server`

## Core Features

1. **Bookmark CRUD** - Save, edit, delete bookmarks (URL, title, memo)
2. **Tags** - Add/remove tags on bookmarks, filter by tag
3. **Search** - Full-text search across title, URL, memo
4. **Favorites** - Pin important bookmarks

## Data Model

### bookmarks
| Column    | Type      | Description          |
|-----------|-----------|----------------------|
| id        | integer   | Primary key          |
| url       | text      | Bookmark URL         |
| title     | text      | Display title        |
| memo      | text      | Optional note        |
| isFavorite| boolean   | Pinned status        |
| createdAt | timestamp | Creation time        |
| updatedAt | timestamp | Last modification    |

### tags
| Column | Type    | Description |
|--------|---------|-------------|
| id     | integer | Primary key |
| name   | text    | Tag name    |

### bookmark_tags
| Column     | Type    | Description           |
|------------|---------|------------------------|
| bookmarkId | integer | FK to bookmarks       |
| tagId      | integer | FK to tags            |

## API Endpoints

| Method | Path                        | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | /api/bookmarks              | List bookmarks (search/filter)  |
| POST   | /api/bookmarks              | Create bookmark                 |
| GET    | /api/bookmarks/:id          | Get single bookmark             |
| PUT    | /api/bookmarks/:id          | Update bookmark                 |
| DELETE | /api/bookmarks/:id          | Delete bookmark                 |
| POST   | /api/bookmarks/:id/tags     | Add tag to bookmark             |
| DELETE | /api/bookmarks/:id/tags     | Remove tag from bookmark        |
| GET    | /api/tags                   | List all tags                   |

## Tech Decisions

- **NestJS** over Express for module-based structure, better suited for parallel agent development
- **SQLite** for zero-config local development
- **Drizzle ORM** for type-safe database access with TypeScript
- **Vite** for fast frontend dev server and build

## Superpowers Skills to Test

| Phase          | Skill                              |
|----------------|-------------------------------------|
| Design         | brainstorming, writing-plans        |
| Implementation | executing-plans, subagent-driven-development, dispatching-parallel-agents |
| Development    | test-driven-development             |
| Review         | requesting-code-review, verification-before-completion |
| Completion     | finishing-a-development-branch      |
