import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [DatabaseModule, BookmarksModule, TagsModule],
})
export class AppModule {}
