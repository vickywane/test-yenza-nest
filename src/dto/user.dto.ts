import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class UserDto {
  // @IsString()
  // id?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User phone number. This is a required field',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User first name. This is a required field',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User last name. This is a required field',
  })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User country code. This is a required field',
  })
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User nationality. This is a required field',
  })
  nationality: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'User date of birth. This is a required field',
  })
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: 'User email. This is a required field',
  })
  email: string;
}
