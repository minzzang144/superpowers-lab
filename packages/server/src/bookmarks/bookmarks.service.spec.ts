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
});
