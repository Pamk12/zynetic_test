import { IsOptional, IsString, IsNumber, Min, Max, IsNumberString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryBookDto {
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  rating?: number;

  @IsOptional()
  @IsString()
  title?: string;
}