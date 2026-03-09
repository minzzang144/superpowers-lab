import { Inject, Injectable } from '@nestjs/common';
import { and, eq, like, or, type SQL } from 'drizzle-orm';
import { DATABASE, DrizzleDB } from '../database/database.module';
import { bookmarks, bookmarkTags } from '../database/schema';
import { TagsService } from '../tags/tags.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly tagsService: TagsService,
  ) {}

  async create(dto: CreateBookmarkDto) {
    const [bookmark] = await this.db
      .insert(bookmarks)
      .values({ url: dto.url, title: dto.title, memo: dto.memo ?? '' })
      .returning();
    return bookmark;
  }

  async findAll(params?: { search?: string; tag?: string; favorite?: boolean }) {
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
      ) as typeof query;
    }

    return query.all();
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
}
