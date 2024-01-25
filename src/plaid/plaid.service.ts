import { Injectable } from '@nestjs/common';
import {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
  CountryCode,
  LinkTokenCreateRequest,
} from 'plaid';
import { PrismaClient } from '@prisma/client';
import { LinkAccount, LinkSuccessMetadata } from './plaid.interface';

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
const prisma = new PrismaClient();

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

  async getAccessToken(userId: number, publicToken?: string) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      const publicTokenFromDb = user?.plaidPublicToken || '';

      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: publicToken || publicTokenFromDb,
      });
      const accessToken = tokenResponse.data.access_token;

      if (accessToken) {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            plaidAccessToken: accessToken,
          },
        });
      }

      const itemId = tokenResponse.data.item_id;
      return { accessToken, itemId };
    } catch (error) {
      console.log('error', error.response);
      throw new Error(error.response);
    }
  }

  /**
   * Update link accounts, institutions, request and save access token
   * @param publicToken
   * @param linkAccounts
   * @param phoneNumber
   * @returns User
   */
  async updateLinkAccounts(
    publicToken: string,
    linkAccounts: LinkSuccessMetadata,
    phoneNumber: string,
  ) {
    const { institution, accounts } = linkAccounts;
    try {
      // get user from database
      const user = await prisma.user.findFirstOrThrow({
        where: {
          phoneNumber: phoneNumber,
        },
        include: {
          linkedAccounts: true,
          linkedInstitutions: true,
        },
      });

      if (institution) {
        // update institution
        await prisma.linkInstitution.upsert({
          where: {
            plaidInstitutionId: institution.id,
          },
          update: {
            name: institution.name,
          },
          create: {
            plaidInstitutionId: institution.id,
            name: institution.name,
            updatedAt: new Date(),
          },
        });
      }

      if (user) {
        // update linked accounts
        const existingAccountIds = user.linkedAccounts.map((account: any) =>
          account.id.toString(),
        );
        // filter out existing accounts
        const newAccounts = accounts.filter(
          (account) => !existingAccountIds.includes(account.id.toString()),
        );

        if (newAccounts.length > 0) {
          // create new accounts
          await prisma.linkedAccount.createMany({
            data: newAccounts.map((account) => ({
              plaidAccountId: account.id,
              name: account.name,
              mask: account.mask,
              subtype: account.subtype.toString(),
              type: account.type as LinkAccount['type'],
              userId: user.id,
              plaidInstitutionId: institution?.id || '',
            })),
          });
        }

        if (publicToken) {
          // update public token of the user
          console.log('publicToken', publicToken);
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              plaidPublicToken: publicToken,
            },
          });

          // get access token and update access token of the user
          const res = await this.getAccessToken(user.id, publicToken);
          console.log('getAccessToken', res);
          if (res.accessToken) {
            // update account balances
            await this.identityGetAndUpdate(user.id);
          }
        }
        return user;
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async identityGetAndUpdate(userId: number) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        include: {
          linkedAccounts: true,
          address: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.plaidAccessToken) {
        throw new Error('User plaid access token not available');
      }

      const response = await client.identityGet({
        access_token: user.plaidAccessToken || '',
      });

      if (response.data.accounts.length > 0) {
        response.data.accounts.forEach(async (account) => {
          await prisma.linkedAccount.update({
            where: {
              plaidAccountId: account.account_id,
              userId: user.id,
            },
            data: {
              plaidAccountId: account.account_id,
              name: account.name,
              officialName: account.official_name,
              mask: account.mask,
              subtype: account.subtype,
              type: account.type,
              updatedAt: new Date(),
              userId: user.id,
              balances: {
                create: {
                  available: account.balances.available,
                  current: account.balances.current,
                  limit: account.balances.limit,
                  isoCurrencyCode: account.balances.iso_currency_code,
                  unofficialCurrencyCode:
                    account.balances.unofficial_currency_code,
                  updatedAt: new Date(),
                },
              },
            },
          });
        });
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async getLinkedBankAccounts(userId: number) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          linkedAccounts: true,
          linkedInstitutions: true,
        },
      });
      if (user) {
        const linkedInstitutionsIds = user.linkedAccounts.map(
          (account) => account.plaidInstitutionId,
        );
        const plaidAccountIds = user.linkedAccounts.map(
          (account) => account.plaidAccountId,
        );
        const linkedInstitutions = await prisma.linkInstitution.findMany({
          where: {
            plaidInstitutionId: {
              in: linkedInstitutionsIds,
            },
          },
        });
        const balances = await prisma.balances.findMany({
          where: {
            plaidAccountId: {
              in: plaidAccountIds,
            },
          },
        });
        const userResponse = {
          ...user,
          linkedInstitutions,
          linkedAccounts: user.linkedAccounts.map((account) => ({
            ...account,
            institution: linkedInstitutions.find(
              (institution) =>
                institution.plaidInstitutionId === account.plaidInstitutionId,
            ),
            balances: balances.find(
              (balance) => balance.plaidAccountId === account.plaidAccountId,
            ),
          })),
        };
        return userResponse;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
