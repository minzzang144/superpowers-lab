import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { DATABASE } from '../database/database.module';

describe('TagsService', () => {
  let service: TagsService;
  let mockDb: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      all: jest.fn().mockResolvedValue([
        { id: 1, name: 'typescript' },
        { id: 2, name: 'react' },
      ]),
      get: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 3, name: 'new-tag' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: DATABASE, useValue: mockDb },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'typescript');
    });
  });

  describe('findOrCreate', () => {
    it('should return existing tag if found', async () => {
      mockDb.get.mockResolvedValueOnce({ id: 1, name: 'typescript' });
      const result = await service.findOrCreate('typescript');
      expect(result).toHaveProperty('id', 1);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should create and return new tag if not found', async () => {
      mockDb.get.mockResolvedValueOnce(undefined);
      const result = await service.findOrCreate('new-tag');
      expect(result).toHaveProperty('id', 3);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
