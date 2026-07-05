import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}