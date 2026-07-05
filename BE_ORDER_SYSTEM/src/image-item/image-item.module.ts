import { Module } from '@nestjs/common';
import { ImageItemService } from './image-item.service';
import { ImageItemController } from './image-item.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImageItemController],
  providers: [ImageItemService],
  exports: [ImageItemService],
})
export class ImageItemModule {}