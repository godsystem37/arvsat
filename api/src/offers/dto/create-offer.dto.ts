import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FIELD_TYPES } from '../field-schema';

export class OfferFieldDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  label!: string;

  @IsIn(FIELD_TYPES)
  type!: (typeof FIELD_TYPES)[number];

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateOfferDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  limit!: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => OfferFieldDto)
  fields!: OfferFieldDto[];
}
