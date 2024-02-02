import {
  Body,
  Controller,
  Get,
  Next,
  Post,
  Render,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { NextFunction, Response } from 'express';
import { SignUpUserDto } from './dto/signupuser.dto';
import { OtpService } from './services/otp.service';

@Controller('/')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly otpService: OtpService,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('/json-mock-otps')
  async getOTPsJSON(@Res() res: Response) {
    const allOTPs = await this.otpService.listAllOTPs();

    return res.status(200).send({ data: allOTPs });
  }

  @Get('/mock-otps')
  @Render('otps')
  async getOTPs(@Res() res: Response) {
    const allOTPs = await this.otpService.listAllOTPs();

    return { data: allOTPs }
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
