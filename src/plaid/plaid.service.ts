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
import { User } from './entities/plaid.entity';
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
    return Promise.resolve().then(async function () {
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
    });
  }

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
        },
      });

      if (institution) {
        // update institution
        await prisma.linkInstitution.upsert({
          where: {
            id: Number(institution.id),
          },
          update: {
            name: institution.name,
          },
          create: {
            id: Number(institution.id),
            name: institution.name,
          },
        });
      }

      if (user) {
        // update linked accounts
        const existingAccountIds = user.linkedAccounts.map((account) =>
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
              linkInstitutionId: Number(institution?.id),
            })),
          });
        }

        // update account balances
        await this.identityGetAndUpdate(user.id);

        if (publicToken) {
          // update public token of the user
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              plaidPublicToken: publicToken,
            },
          });

          // get access token and update access token of the user
          await this.getAccessToken(user.id, publicToken);
        }

        return user;
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async createNewUser(user: User) {
    try {
      const userExist = !!(await prisma.user.findFirst({
        where: {
          OR: [
            {
              phoneNumber: user.phoneNumber,
            },
            {
              email: user.email,
            },
          ],
        },
      }));
      if (userExist) {
        throw new Error('User already exist');
      }

      const newUser = await prisma.user.create({
        data: {
          givenName: user.givenName,
          familyName: user.familyName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
        },
      });

      if (user.address) {
        await prisma.address.upsert({
          where: {
            userId: newUser.id,
          },
          update: {
            street: user.address.street,
            street2: user.address.street2,
            city: user.address.city,
            state: user.address.state,
            postCode: user.address.postCode,
            country: user.address.country,
          },
          create: {
            street: user.address.street,
            street2: user.address.street2,
            city: user.address.city,
            state: user.address.state,
            postCode: user.address.postCode,
            userId: newUser.id,
            country: user.address.country,
          },
        });
      }

      return newUser;
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
        const accountsUpdate = response.data.accounts.map((account) => {
          return {
            plaidAccountId: account.account_id,
            name: account.name,
            officialName: account.official_name,
            mask: account.mask,
            subtype: account.subtype,
            type: account.type,
            updatedAt: new Date(),
            balances: {
              available: account.balances.available,
              current: account.balances.current,
              limit: account.balances.limit,
              isoCurrencyCode: account.balances.iso_currency_code,
              unofficialCurrencyCode: account.balances.unofficial_currency_code,
              plaidAccountId: account.account_id,
              updatedAt: new Date(),
            },
            userId: user.id,
          };
        });

        await prisma.linkedAccount.updateMany({
          where: {
            userId: user.id,
          },
          data: accountsUpdate,
        });
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
