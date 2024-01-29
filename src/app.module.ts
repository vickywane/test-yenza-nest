import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PlaidService } from './plaid/plaid.service';

@Module({
  imports: [PlaidModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, PrismaService, PlaidService],
})
export class AppModule {}
