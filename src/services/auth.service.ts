import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async generateJWTToken(
    user: Pick<
      UserDto,
      'email' | 'firstName' | 'lastName' | 'phoneNumber' | 'nationality'
    > & { id: string },
  ): Promise<string> {
    return await this.jwtService.signAsync(user);
  }

  async verifyJWTToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      console.log(`error verifying token`, error);

      throw new Error(error);
    }
  }

  async generateRefreshToken(token: string): Promise<any> {
    // return await this.jwtService.re
  }
}
