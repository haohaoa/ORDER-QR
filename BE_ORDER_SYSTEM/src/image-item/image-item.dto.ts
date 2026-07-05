import { IsString, IsOptional } from 'class-validator';

export class CreateImageItemDto {
  @IsString()
  menuId: string;

  @IsString()
  image: string;
}

export class UpdateImageItemDto {
  @IsOptional()
  @IsString()
  image?: string;
}