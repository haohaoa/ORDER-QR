import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateStaffAccountDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  pin?: string;
}

export class UpdateStaffAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  pin?: string;
}
