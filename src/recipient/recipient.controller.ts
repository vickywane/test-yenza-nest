import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RecipientService } from './recipient.service';
import { CreateRecipientDto } from './dto/create-recipient.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CustomRequest } from 'src/dto/customrequest.dto';

@Controller('/api/v1/recipient')
export class RecipientController {
  constructor(private readonly recipientService: RecipientService) {}

  @UseGuards(AuthGuard)
  @UsePipes(ValidationPipe)
  @Post()
  create(
    @Req() req: CustomRequest,
    @Body() createRecipientDto: CreateRecipientDto,
  ) {
    const userId = req['user'].id;
    return this.recipientService.create(createRecipientDto, userId);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: CustomRequest) {
    const userId = req['user'].id;
    return this.recipientService.findAll(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipientService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipientService.remove(id);
  }
}
