import { Module } from '@nestjs/common';
import { StaffAccountService } from './staff-account.service';
import { StaffAccountController } from './staff-account.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffAccountController],
  providers: [StaffAccountService],
  exports: [StaffAccountService],
})
export class StaffAccountModule {}
