import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateMenuItemOptionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  available: boolean;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemOptionDto)
  options?: CreateMenuItemOptionDto[];
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemOptionDto)
  options?: CreateMenuItemOptionDto[];
}

export class CreateImageItemDto {
  @IsString()
  menuId: string;

  @IsString()
  image: string;
}

export class CreateOptionItemDto {
  @IsString()
  menuId: string;

  @IsString()
  name: string;

  @IsBoolean()
  required: boolean;
}