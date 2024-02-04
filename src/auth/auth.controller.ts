import {
  Body,
  Controller,
  Next,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { UserDto } from 'src/dto/user.dto';
import { UserService } from 'src/services/user.service';
import { AuthService } from 'src/services/auth.service';
import { OtpService } from 'src/services/otp.service';
import { OTP_GENERATION_PURPOSE } from '@prisma/client';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  @Post('/login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() body: Partial<Pick<UserDto, 'email' | 'phoneNumber'>>,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber) {
        return res
          .status(400)
          .send({ message: 'Phone number or email are required' });
      }

      const user = await this.userService.getUser({
        email: body.email,
        phoneNumber: body.phoneNumber,
      });

      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      await this.otpService.generateOTP(user.id, 'LOGIN');

      // Implement sending OTP to user via email or phoneNumeber

      return res.status(200).json({ message: 'OTP Sent' });
    } catch (error) {
      next(error);
      return res.status(400).json({ message: 'error in login user', error });
    }
  }

  // @Post('/verify-email')
  // @UsePipes(ValidationPipe)
  // async verifyEmail(
  //   @Body() body: SignUpUserDto,
  //   @Res() res: Response,
  //   @Next() next: NextFunction,
  // ) {
  //   // try {
  //   //   if (!body.phoneNumber || !body.email) {
  //   //     throw new Error('Phone number and email are required');
  //   //   }
  //   //   const response = await this.appService.createNewUser(body);
  //   //   res.json(response);
  //   // } catch (error) {
  //   //   next(error);
  //   //   throw new Error(error);
  //   // }
  // }

  // TODO: write helper function to check if values are valid in enums.

  @Post('/verify-otp')
  @UsePipes(ValidationPipe)
  async verifyPhoneOTP(
    @Body()
    body: {
      code: string;
      phoneNumber: string;
      purpose: OTP_GENERATION_PURPOSE;
    },
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber || !body.code) {
        return res
          .status(400)
          .send({ message: 'code or phoneNumber values are missing' });
      }

      const matchCode = await this.otpService.getOTPCode(body.code);
      if (
        !matchCode ||
        matchCode?.purpose !== body.purpose ||
        matchCode.status !== 'IDLE'
      ) {
        return res.status(400).send({ message: 'Invalid OTP' });
      }

      const user = await this.userService.getUser({ id: matchCode?.userId });

      if (!user) {
        await this.otpService.updateOTPStatus(matchCode.id, 'REVOKED');

        return res.status(400).json({ message: 'Unallocated OTP' });
      }

      const accessToken = await this.authService.generateJWTToken({
        email: user.email,
        id: user.id,
        firstName: user.familyName as string,
        lastName: user.familyName as string,
        nationality: user.countryCode as string,
        phoneNumber: user.phoneNumber,
      });

      await this.otpService.updateOTPStatus(matchCode.id, 'VALIDATED');

      res.status(200).json({
        accessToken,
        expiresIn: 7200,
        tokenType: 'JWT',
        refreshToken: '',
      });
    } catch (error) {
      next(error);
      res.status(400).json({ message: 'error in verify-otp', error });
    }
  }

  // @Post('/verify-login-otp')
  // @UsePipes(ValidationPipe)
  // async verifyLoginOTP(
  //   @Body() body: SignUpUserDto,
  //   @Res() res: Response,
  //   @Next() next: NextFunction,
  // ) {
  //   // try {
  //   //   if (!body.phoneNumber || !body.email) {
  //   //     throw new Error('Phone number and email are required');
  //   //   }
  //   //   const response = await this.appService.createNewUser(body);
  //   //   res.json(response);
  //   // } catch (error) {
  //   //   next(error);
  //   //   throw new Error(error);
  //   // }
  // }

  @Post('/resend-login-otp')
  @UsePipes(ValidationPipe)
  async resendOTP(
    @Body()
    body: Pick<UserDto, 'phoneNumber' | 'email'> & {
      purpose: OTP_GENERATION_PURPOSE;
    },
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber || !body.email) {
        throw new Error('Phone number and email are required');
      }

      const user = await this.userService.getUser({
        email: body.email,
        phoneNumber: body.email,
      });

      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      await this.otpService.generateOTP(user.id, 'LOGIN');

      // Implement sending OTP to user via email or phoneNumeber

      return res.json({ message: 'OTP Sent' });
    } catch (error) {
      next(error);
      res.status(400).json({ message: 'error in login user', error });
    }
  }
}
