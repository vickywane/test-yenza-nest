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
import { NextFunction, Response } from 'express';
import { PlaidService } from './plaid.service';
import { LinkAccountDto } from './dto/linkAccount.dto';
import { IdentityVerificationRetryDto } from './dto/identityVerification.dto';

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
  @UsePipes(ValidationPipe)
  // Exchange token flow - exchange a Link public_token for access token
  // See https://plaid.com/docs/#exchange-token-flow
  async updateLinkAccounts(
    @Body() body: LinkAccountDto,
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

  @Get('accounts/:userId')
  async getLinkedBankAccounts(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const response = await this.plaidService.getLinkedBankAccounts(userId);
      console.log('userResponse', response);
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Post('identity-verification/create/:userId')
  async createIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const response =
        await this.plaidService.createIdentityVerification(userId);
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Get('identity-verification/:userId')
  async getIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const response = await this.plaidService.getIdentityVerification(
        userId,
      );
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Get('identity-verification/list/:userId')
  async listIdentityVerification(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const response = await this.plaidService.listIdentityVerification(
        userId,
      );
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }

  @Post('identity-verification/retry/:userId')
  @UsePipes(ValidationPipe)
  async retryIdentityVerification(
    @Param('userId') userId: string,
    @Body() body: IdentityVerificationRetryDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    try {
      const response = await this.plaidService.retryIdentityVerification(
        userId,
        body.retrySteps,
      );
      res.json(response);
    } catch (error) {
      next(error);
      throw new Error(error);
    }
  }
}
