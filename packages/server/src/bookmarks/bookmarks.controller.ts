import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Controller('api/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(@Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('favorite') favorite?: string,
  ) {
    return this.bookmarksService.findAll({
      search,
      tag,
      favorite: favorite === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookmarksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookmarkDto) {
    return this.bookmarksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookmarksService.remove(id);
  }

  @Post(':id/tags')
  addTag(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    return this.bookmarksService.addTag(id, body.name);
  }

  @Delete(':id/tags')
  removeTag(@Param('id', ParseIntPipe) id: number, @Body() body: { tagId: number }) {
    return this.bookmarksService.removeTag(id, body.tagId);
  }
}
