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
import { SignUpUserDto } from '../dto/signupuser.dto';
import { UserDto } from 'src/dto/user.dto';
import { UserService } from 'src/services/user.service';
import { AuthService } from 'src/services/auth.service';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('/login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() body: Pick<UserDto, 'email'>,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.email) {
        throw new Error('Phone number and email are required');
      }

      const user = await this.userService.getUser({
        email: body.email,
        phoneNumber: body.email,
      });

      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      // GENERATE JWT TOKEN FOR USER IN LOGIN FLOW

      const accessToken = await this.authService.generateJWTToken({
        email: user.email,
        id: user.id,
        firstName: user.familyName as string,
        lastName: user.familyName as string,
        nationality: user.countryCode as string,
        phoneNumber: user.phoneNumber,
      });

      // const response = await this.appService.createNewUser(body);
      res.json({
        accessToken,
        expiresIn: 7200,
        tokenType: 'JWT',
        refreshToken: '',
      });
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Post('/verify-email')
  @UsePipes(ValidationPipe)
  async verifyEmail(
    @Body() body: SignUpUserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    // try {
    //   if (!body.phoneNumber || !body.email) {
    //     throw new Error('Phone number and email are required');
    //   }
    //   const response = await this.appService.createNewUser(body);
    //   res.json(response);
    // } catch (error) {
    //   next(error);
    //   throw new Error(error);
    // }
  }

  @Post('/verify-phone-otp')
  @UsePipes(ValidationPipe)
  async verifyPhoneOTP(
    @Body() body: SignUpUserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    // try {
    //   if (!body.phoneNumber || !body.email) {
    //     throw new Error('Phone number and email are required');
    //   }
    //   const response = await this.appService.createNewUser(body);
    //   res.json(response);
    // } catch (error) {
    //   next(error);
    //   throw new Error(error);
    // }
  }

  @Post('/verify-login-otp')
  @UsePipes(ValidationPipe)
  async verifyLoginOTP(
    @Body() body: SignUpUserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    // try {
    //   if (!body.phoneNumber || !body.email) {
    //     throw new Error('Phone number and email are required');
    //   }
    //   const response = await this.appService.createNewUser(body);
    //   res.json(response);
    // } catch (error) {
    //   next(error);
    //   throw new Error(error);
    // }
  }

  @Post('/resend-login-otp')
  @UsePipes(ValidationPipe)
  async resendLoginOTP(
    @Body() body: SignUpUserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    // try {
    //   if (!body.phoneNumber || !body.email) {
    //     throw new Error('Phone number and email are required');
    //   }
    //   const response = await this.appService.createNewUser(body);
    //   res.json(response);
    // } catch (error) {
    //   next(error);
    //   throw new Error(error);
    // }
  }
}
