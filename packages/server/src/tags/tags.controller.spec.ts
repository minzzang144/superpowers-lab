import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  let controller: TagsController;

  const mockService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'typescript' },
      { id: 2, name: 'react' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [{ provide: TagsService, useValue: mockService }],
    }).compile();

    controller = module.get<TagsController>(TagsController);
  });

  it('GET /api/tags - should return all tags', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(2);
    expect(mockService.findAll).toHaveBeenCalled();
  });
});
