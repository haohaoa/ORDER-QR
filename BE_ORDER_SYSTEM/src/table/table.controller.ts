import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto } from './table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Owner } from '../auth/decorators/owner.decorator';
import { UserRole } from '@prisma/client';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
@Roles(UserRole.admin, UserRole.manager)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  create(@Body() createTableDto: CreateTableDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.tableService.create(createTableDto, userId);
  }

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === UserRole.admin;
    return this.tableService.findForUser(userId, isAdmin);
  }

  @Get(':id')
  @Owner({ model: 'Table' })
  findOne(@Param('id') id: string) {
    return this.tableService.findOne(id);
  }

  @Patch(':id')
  @Owner({ model: 'Table' })
  update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tableService.update(id, updateTableDto);
  }

  @Delete(':id')
  @Owner({ model: 'Table' })
  remove(@Param('id') id: string) {
    return this.tableService.remove(id);
  }
}