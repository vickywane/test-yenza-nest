// recipient.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRecipientDto } from './dto/create-recipient.dto';

@Injectable()
export class RecipientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createRecipient: CreateRecipientDto,
    userId: string,
  ): Promise<CreateRecipientDto> {
    return this.prisma?.recipient.create({
      data: {
        ...createRecipient,
        userId: userId,
      },
    });
  }

  async findAll(userId: string): Promise<CreateRecipientDto[]> {
    return this.prisma?.recipient.findMany({
      where: {
        userId: userId,
      },
    });
  }

  async findOne(id: string): Promise<CreateRecipientDto | null> {
    return this.prisma?.recipient.findUnique({
      where: {
        id: id,
      },
    });
  }

  async remove(id: string): Promise<CreateRecipientDto> {
    return this.prisma?.recipient.delete({
      where: {
        id: id,
      },
    });
  }
}
