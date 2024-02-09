import { Request } from 'express';
import { TokenUserDto } from './tokenuser.dto';

export interface CustomRequest extends Request {
  user: TokenUserDto;
}
