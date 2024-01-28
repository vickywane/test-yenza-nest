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
import { UserService } from 'src/services/user.service';
import { AuthGuard } from 'src/services/auth.guard';

@Controller('/api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async signUp(
    @Body() body: UserDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      if (!body.phoneNumber || !body.email) {
        throw new Error('Required user properties are missing');
      }

      const response = await this.userService.createNewUser(body);
      res.json({ message: 'kyc details recorded.', data: response });
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
      if (!body.postCode || !body.address || !params.userId || !params.userId) {
        throw new Error('Required user properties are missing');
      }

      await this.userService.insertUserKYC({
        userId: parseInt(params.userId),
        kycDetails: body,
      });

      res.json({ message: 'kyc details recorded.' });
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }
}
