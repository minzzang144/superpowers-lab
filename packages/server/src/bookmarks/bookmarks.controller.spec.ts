import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
    findAll: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Example' }]),
    findOne: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com', title: 'Example' }),
    update: jest.fn().mockResolvedValue({ id: 1, url: 'https://updated.com', title: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [{ provide: BookmarksService, useValue: mockService }],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
    jest.clearAllMocks();
  });

  it('POST /api/bookmarks - should create a bookmark', async () => {
    const dto = { url: 'https://example.com', title: 'Example' };
    const result = await controller.create(dto);
    expect(result).toHaveProperty('id', 1);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('GET /api/bookmarks - should return all bookmarks', async () => {
    const result = await controller.findAll(undefined, undefined, undefined);
    expect(result).toHaveLength(1);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('GET /api/bookmarks/:id - should return one bookmark', async () => {
    const result = await controller.findOne(1);
    expect(result).toHaveProperty('id', 1);
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('PUT /api/bookmarks/:id - should update a bookmark', async () => {
    const dto = { title: 'Updated' };
    const result = await controller.update(1, dto);
    expect(result).toHaveProperty('title', 'Updated');
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('DELETE /api/bookmarks/:id - should delete a bookmark', async () => {
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
