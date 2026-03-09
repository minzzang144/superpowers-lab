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
