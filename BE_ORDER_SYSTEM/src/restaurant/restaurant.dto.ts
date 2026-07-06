import { IsString, IsOptional, IsEmail, IsDefined, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateManagerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateManagerDto)
  manager: CreateManagerDto;
}
