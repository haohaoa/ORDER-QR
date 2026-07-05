import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateImageItemDto, CreateOptionItemDto } from './menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Owner } from '../auth/decorators/owner.decorator';
import { OwnerGuard } from '../auth/guards/owner.guard';
@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard )
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Public()
  @Get('by-qrcode/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.menuItemService.findByQrCode(qrCode);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.manager)
  create(@Body() createMenuItemDto: CreateMenuItemDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.menuItemService.create(createMenuItemDto, userId);
  }

  @Post(':id/upload')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
          cb(null, safeName);
        },
      }),
    }),
  )
  uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    const imagePath = `${file.filename}`;
     return this.menuItemService.addImageAndGetMenuItem(id, { menuId: id, image: imagePath });
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager)
  findAll(@Request() req: any, @Query('tableId') tableId?: string) {
    const userId = req.user?.id;
    return this.menuItemService.findForUser(userId, tableId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service)
  update(@Param('id') id: string, @Body() updateMenuItemDto: UpdateMenuItemDto) {
    return this.menuItemService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @Owner({ model: 'MenuItem' })
  @Roles(UserRole.admin, UserRole.manager)
  remove(@Param('id') id: string) {
    return this.menuItemService.remove(id);
  }

  @Post(':id/images')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service)
  addImage(@Param('id') id: string, @Body() createImageItemDto: CreateImageItemDto) {
    return this.menuItemService.addImage({ ...createImageItemDto, menuId: id });
  }

  @Post(':id/options')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service)
  addOption(@Param('id') id: string, @Body() createOptionItemDto: CreateOptionItemDto) {
    return this.menuItemService.addOption({ ...createOptionItemDto, menuId: id });
  }

  @Delete(':id/images/:imageId')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service)
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.menuItemService.deleteImage(parseInt(imageId));
  }
}