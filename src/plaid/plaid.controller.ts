import { Body, Controller, Get, Next, Post, Res } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { PlaidService } from './plaid.service';
import { LinkSuccess } from './plaid.interface';

@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Get('link-token')
  // Create a link token with configs which we can then use to initialize Plaid Link client-side.
  // See https://plaid.com/docs/#create-link-token
  async getLinkToken(@Res() res: Response, @Next() next: NextFunction) {
    try {
      const response = await this.plaidService.getLinkToken();
      console.log('response', response);
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Post('link-accounts')
  // Exchange token flow - exchange a Link public_token for access token
  // See https://plaid.com/docs/#exchange-token-flow
  async updateLinkAccounts(
    @Body() body: LinkSuccess & { phoneNumber: string },
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
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
      next(error);
      throw new Error(error);
    }
  }
}
