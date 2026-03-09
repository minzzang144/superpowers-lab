import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.module';
import type { DrizzleDB } from '../database/database.module';
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
