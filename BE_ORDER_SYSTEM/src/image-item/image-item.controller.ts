import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ImageItemService } from './image-item.service';
import { CreateImageItemDto, UpdateImageItemDto } from './image-item.dto';

@Controller('image-items')
export class ImageItemController {
  constructor(private readonly imageItemService: ImageItemService) {}

  @Post()
  create(@Body() createImageItemDto: CreateImageItemDto) {
    return this.imageItemService.create(createImageItemDto);
  }

  @Get()
  findAll() {
    return this.imageItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imageItemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateImageItemDto: UpdateImageItemDto) {
    return this.imageItemService.update(id, updateImageItemDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imageItemService.remove(id);
  }
}