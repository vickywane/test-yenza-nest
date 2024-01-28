import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class SignUpUserDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
