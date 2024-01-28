import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlaidModule } from './plaid/plaid.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [PlaidModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
