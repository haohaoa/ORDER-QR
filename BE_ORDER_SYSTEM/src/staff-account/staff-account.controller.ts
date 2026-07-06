import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Req, Param } from '@nestjs/common';
import { StaffAccountService } from './staff-account.service';
import { CreateStaffAccountDto, UpdateStaffAccountDto } from './staff-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';

@Controller('staff-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffAccountController {
  constructor(private readonly staffAccountService: StaffAccountService) {}

  @Post()
  @Roles(UserRole.manager, UserRole.admin)
  create(@Req() req: any, @Body() createStaffAccountDto: CreateStaffAccountDto) {
    return this.staffAccountService.create(req.user.id, createStaffAccountDto);
  }

  @Get()
  @Roles(UserRole.manager, UserRole.admin)
  findByUserId(@Req() req: any) {
    return this.staffAccountService.findByRestaurant(req.user.id);
  }

  @Patch()
  @Roles(UserRole.manager, UserRole.admin)
  update(@Req() req: any, @Body() updateStaffAccountDto: UpdateStaffAccountDto) {
    return this.staffAccountService.update(req.user.id, updateStaffAccountDto);
  }

  @Delete(':id')
  @Roles(UserRole.manager, UserRole.admin)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.staffAccountService.remove(req.user.id, id);
  }
}
