import {
  Body,
  Controller,
  Next,
  Param,
  Post,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { UserDto } from 'src/dto/user.dto';
import { UserKYCDto } from 'src/dto/kyc.dto';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { OtpService } from 'src/services/otp.service';

@Controller('/api/v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
  ) {}

  @Post('create')
  @UsePipes(ValidationPipe)
  async signUp(
    @Body() body: UserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber || !body.email) {
        return res
          .status(400)
          .send({ message: 'Required user properties are missing' });
      }
      console.log('body', body);
      const newUser = await this.userService.createNewUser(body);
      await this.otpService.generateOTP(newUser.id, 'CREATE_ACCOUNT');

      res.status(200).json(newUser);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @UseGuards(AuthGuard)
  @Post(':userId/kyc-details')
  @UsePipes(ValidationPipe)
  async registerUserKYC(
    @Param() params: { userId: string },
    @Body() body: UserKYCDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.postCode || !body.address || !params.userId) {
        return res
          .status(400)
          .send({ message: 'Required user properties are missing' });
      }

      await this.userService.insertUserKYC({
        userId: params.userId,
        kycDetails: body,
      });

      res.status(200).json({ message: 'kyc details recorded.' });
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }
}
