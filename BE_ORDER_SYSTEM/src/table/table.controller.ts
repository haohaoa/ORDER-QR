import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto } from './table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { Owner } from '../auth/decorators/owner.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
@Roles(UserRole.admin, UserRole.manager, UserRole.service)
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post()
  create(@Body() createTableDto: CreateTableDto, @Request() req: any) {
    const restaurantId = req.user?.restaurantId;
    return this.tableService.create(createTableDto, restaurantId);
  }

  @Get()
  findAll(@Request() req: any) {
    const restaurantId = req.user?.restaurantId;
    const isAdmin = req.user?.role === UserRole.admin;
    return this.tableService.findForUser(restaurantId, isAdmin);
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