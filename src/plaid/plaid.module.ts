import { Module } from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PlaidController],
  providers: [PlaidService, PrismaService],
})
export class PlaidModule {}
