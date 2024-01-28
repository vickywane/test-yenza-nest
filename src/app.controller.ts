import {
  Body,
  Controller,
  Get,
  Next,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { NextFunction, Response } from 'express';
import { SignUpUserDto } from './dto/signupuser.dto';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('sign-up')
  @UsePipes(ValidationPipe)
  async signUp(
    @Body() body: SignUpUserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber || !body.email) {
        throw new Error('Phone number and email are required');
      }
      const response = await this.appService.createNewUser(body);
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }
}
