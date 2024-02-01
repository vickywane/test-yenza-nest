import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PlaidService } from './plaid/plaid.service';

import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PlaidModule,
    ConfigModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7200s' },
    }),
  ],
  controllers: [AppController, AuthController, UserController],
  providers: [
    AppService,
    AuthService,
    PrismaService,
    PlaidService,
    UserService,
  ],
})
export class AppModule {}
