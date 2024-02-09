import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PlaidService } from './plaid/plaid.service';

import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from './services/otp.service';
import { RecipientModule } from './recipient/recipient.module';

@Module({
  imports: [
    PlaidModule,
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7200s' },
    }),
    RecipientModule,
  ],
  controllers: [AppController, AuthController, UserController],
  providers: [
    OtpService,
    AppService,
    AuthService,
    PrismaService,
    PlaidService,
    UserService,
  ],
})
export class AppModule {}
