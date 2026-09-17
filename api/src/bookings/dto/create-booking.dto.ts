import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { FIO_RE, formatFio, PHONE_E164_RE } from '../../validation/fields';

export class CreateBookingDto {
  @Transform(({ value }) => (typeof value === 'string' ? formatFio(value) : value))
  @IsString()
  @Matches(FIO_RE, { message: 'ФИО — фамилия, имя и отчество с заглавной буквы' })
  @MaxLength(80)
  name!: string;

  @IsString()
  @Matches(PHONE_E164_RE, { message: 'Телефон в формате +7XXXXXXXXXX' })
  phone!: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;
}
