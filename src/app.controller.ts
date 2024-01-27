import { Body, Controller, Next, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { SignUpUser } from './plaid/plaid.interface';
import { NextFunction, Response } from 'express';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('sign-up')
  async signUp(
    @Body() body: SignUpUser,
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
