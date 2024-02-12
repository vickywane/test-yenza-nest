import { Module } from '@nestjs/common';
import { RecipientService } from './recipient.service';
import { RecipientController } from './recipient.controller';
import { PrismaService } from '../prisma.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers: [RecipientController],
  providers: [RecipientService, PrismaService, AuthService],
})
export class RecipientModule {}
