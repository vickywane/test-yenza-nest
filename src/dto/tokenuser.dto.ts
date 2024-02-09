import { UserDto } from './user.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class TokenUserDto extends UserDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  iat: number;
  exp: number;
}
