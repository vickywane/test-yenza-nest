import { Module } from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';

@Module({
  controllers: [PlaidController],
  providers: [PlaidService],
})
export class PlaidModule {}
