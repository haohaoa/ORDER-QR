import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.owner)
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.createWithManager(createRestaurantDto);
  }
}
