import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { OptionItemService } from './option-item.service';
import { CreateOptionItemDto, UpdateOptionItemDto } from './option-item.dto';

@Controller('option-items')
export class OptionItemController {
  constructor(private readonly optionItemService: OptionItemService) {}

  @Post()
  create(@Body() createOptionItemDto: CreateOptionItemDto) {
    return this.optionItemService.create(createOptionItemDto);
  }

  @Get()
  findAll() {
    return this.optionItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.optionItemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOptionItemDto: UpdateOptionItemDto) {
    return this.optionItemService.update(id, updateOptionItemDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.optionItemService.remove(id);
  }
}