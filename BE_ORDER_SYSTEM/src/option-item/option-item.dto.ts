import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateOptionItemDto {
  @IsString()
  menuId: string;

  @IsString()
  name: string;

  @IsBoolean()
  required: boolean;
}

export class UpdateOptionItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}