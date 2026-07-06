import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { Owner } from '../auth/decorators/owner.decorator';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get('by-qrcode/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.categoryService.findByQrCode(qrCode);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.manager)
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: any) {
    return this.categoryService.create(createCategoryDto, req.user?.restaurantId);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager)
  findAll(@Request() req: any) {
    return this.categoryService.findAll(req.user?.restaurantId);
  }

  @Get(':id')
  @Owner({ model: 'Category' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Owner({ model: 'Category' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Owner({ model: 'Category' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}