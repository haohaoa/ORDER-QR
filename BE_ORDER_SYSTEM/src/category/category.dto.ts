import { IsString, IsInt } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsInt()
  sortOrder: number;
}

export class UpdateCategoryDto {
  @IsString()
  name?: string;

  @IsInt()
  sortOrder?: number;
}