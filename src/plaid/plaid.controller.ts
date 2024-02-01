import {
  Body,
  Controller,
  Get,
  Next,
  Param,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { PlaidService } from './plaid.service';
import { LinkAccountDto } from './dto/linkAccount.dto';
import { IdentityVerificationRetryDto } from './dto/identityVerification.dto';

@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Get('link-token')
  // Create a link token with configs which we can then use to initialize Plaid Link client-side.
  // See https://plaid.com/docs/#create-link-token
  async getLinkToken(@Res() res: Response) {
    try {
      const response = await this.plaidService.getLinkToken();
      console.log('response', response);
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Post('link-accounts')
  @UsePipes(ValidationPipe)
  // Exchange token flow - exchange a Link public_token for access token
  // See https://plaid.com/docs/#exchange-token-flow
  async updateLinkAccounts(@Body() body: LinkAccountDto, @Res() res: Response) {
    try {
      if (!body.publicToken) {
        throw new Error('Public token is required');
      }
      const response = await this.plaidService.updateLinkAccounts(
        body.publicToken,
        body.metadata,
        body.phoneNumber,
      );
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Get('accounts/:userId')
  async getLinkedBankAccounts(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.plaidService.getLinkedBankAccounts(
        Number(userId),
      );
      console.log('userResponse', response);
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Post('identity-verification/create/:userId')
  async createIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.plaidService.createIdentityVerification(
        Number(userId),
      );
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Get('identity-verification/:userId')
  async getIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.plaidService.getIdentityVerification(
        Number(userId),
      );
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Get('identity-verification/list/:userId')
  async listIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.plaidService.listIdentityVerification(
        Number(userId),
      );
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }

  @Post('identity-verification/retry/:userId')
  @UsePipes(ValidationPipe)
  async retryIdentityVerification(
    @Param('userId') userId: string,
    @Body() body: IdentityVerificationRetryDto,
    @Res() res: Response,
  ) {
    try {
      const response = await this.plaidService.retryIdentityVerification(
        Number(userId),
        body.retrySteps,
      );
      res.json(response);
    } catch (error) {
      res.json({ error: error.message });
    }
  }
}
