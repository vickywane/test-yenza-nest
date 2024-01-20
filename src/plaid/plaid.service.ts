import { Injectable } from '@nestjs/common';
import {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
  CountryCode,
  LinkTokenCreateRequest,
} from 'plaid';
const dotenv = require('dotenv');
dotenv?.config();

const PLAID_PRODUCTS = (
  process.env.PLAID_PRODUCTS || Products.Transactions
).split(',');

const PLAID_COUNTRY_CODES: CountryCode[] = (
  process.env.PLAID_COUNTRY_CODES || 'US'
).split(',') as CountryCode[];
const PLAID_REDIRECT_URI: string = process.env.PLAID_REDIRECT_URI || '';
const PLAID_ENV: string = 'sandbox';
const PLAID_CLIENT_ID: string | undefined = process.env
  .PLAID_CLIENT_ID as string;
const PLAID_SECRET: string | undefined = process.env.PLAID_SECRET as string;
// const ACCESS_TOKEN: string | null = null;
// const PUBLIC_TOKEN: string | null = null;

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

const client = new PlaidApi(configuration);

@Injectable()
export class PlaidService {
  async getLinkToken() {
    return Promise.resolve().then(async function () {
      const configs: LinkTokenCreateRequest = {
        user: {
          // This should correspond to a unique id for the current user.
          client_user_id: 'user-id',
        },
        client_name: 'Plaid Quickstart',
        products: PLAID_PRODUCTS as Products[],
        country_codes: PLAID_COUNTRY_CODES as CountryCode[],
        language: 'en',
        redirect_uri: PLAID_REDIRECT_URI || '',
      };
      try {
        const createTokenResponse = await client.linkTokenCreate(
          configs as any,
        );
        return createTokenResponse.data;
      } catch (error) {
        console.log('error', error.response);
        throw new Error(error.response);
      }
    });
  }

  async getAccessToken(publicToken: string) {
    return Promise.resolve().then(async function () {
      try {
        const tokenResponse = await client.itemPublicTokenExchange({
          public_token: publicToken,
        });
        return tokenResponse.data;
      } catch (error) {
        console.log('error', error.response);
        throw new Error(error.response);
      }
    });
  }
}
