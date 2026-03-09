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
