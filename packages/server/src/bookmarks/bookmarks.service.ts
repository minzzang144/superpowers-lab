import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, DrizzleDB } from '../database/database.module';
import { bookmarks } from '../database/schema';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

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
}
