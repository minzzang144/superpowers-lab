import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
  imports: [DatabaseModule, BookmarksModule],
})
export class AppModule {}
