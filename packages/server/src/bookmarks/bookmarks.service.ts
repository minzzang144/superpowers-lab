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
