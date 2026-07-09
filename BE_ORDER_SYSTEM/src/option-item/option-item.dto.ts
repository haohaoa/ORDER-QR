import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateOptionItemDto {
  @IsString()
  menuId: string;

  @IsString()
  name: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @IsOptional()
  choices?: any;

  @IsOptional()
  @IsNumber()
  price?: number;
}

export class UpdateOptionItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @IsOptional()
  choices?: any;

  @IsOptional()
  @IsNumber()
  price?: number;
}