import { Module } from '@nestjs/common';
import { OptionItemService } from './option-item.service';
import { OptionItemController } from './option-item.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OptionItemController],
  providers: [OptionItemService],
  exports: [OptionItemService],
})
export class OptionItemModule {}