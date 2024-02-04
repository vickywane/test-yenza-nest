import { Injectable } from '@nestjs/common';
import { generate as OTPGenerate } from 'otp-generator';

import { UserService } from './user.service';
import { UserDto } from 'src/dto/user.dto';
import { PrismaService } from 'src/prisma.service';

export type OTP_GENERATION_PURPOSE =
  | 'LOGIN'
  | 'RESET_PASSWORD'
  | 'CONFIRM_EMAIL'
  | 'CONFIRM_PHONE_NUMBER'
  | 'CREATE_ACCOUNT';

export type OTP_STATUS = 'IDLE' | 'REVOKED' | 'VALIDATED';

@Injectable()
export class OtpService {
  constructor(
    private userService: UserService,
    private prismaService: PrismaService,
  ) {}

  async getOTPCode(code: string) {
    try {
      const user = await this.prismaService.oTP.findFirst({
        where: {
          code,
        },
      });

      return user;
    } catch (error) {
      console.log('get code error', error);
      throw new Error(error);
    }
  }

  async generateOTP(userId: string, purpose: OTP_GENERATION_PURPOSE) {
    try {
      const user = await this.userService.getUser({ id: userId });

      if (!user) {
        throw new Error('User not found!');
      }

      const otpCode = OTPGenerate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      await this.insertOTP({
        code: otpCode,
        user: { ...user, id: userId },
        purpose,
      });

      return otpCode;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async insertOTP({
    code,
    user,
    purpose,
  }: {
    code: string;
    user: Pick<UserDto, 'email' | 'phoneNumber'> & { id: string };
    purpose: OTP_GENERATION_PURPOSE;
  }) {
    try {
      return await this.prismaService.oTP.create({
        data: {
          code,
          email: user.email,
          phoneNumber: user.phoneNumber,
          purpose,
          userId: user.id,
        },
      });
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async updateOTPStatus(codeId: string, status : OTP_STATUS) {
    try {
      const update = await this.prismaService.oTP.update({
        where: {
          id: codeId,
        },
        data: {
          status,
        },
      });

      return update;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async validateOTP(userId: string, otpCode: string) {
    try {
      const user = await this.userService.getUser({ id: userId });

      if (!user) {
        throw new Error('User not found!');
      }

      const otpCode = OTPGenerate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      return otpCode;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async listAllOTPs() {
    try {
      return await this.prismaService.oTP.findMany();
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
