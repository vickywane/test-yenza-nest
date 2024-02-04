import { Controller, Get, Render, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
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
  async getOTPs() {
    const allOTPs = await this.otpService.listAllOTPs();

    return { data: allOTPs };
  }
}
