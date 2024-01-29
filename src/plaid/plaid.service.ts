import { Injectable } from '@nestjs/common';
import {
  Configuration,
  PlaidApi,
  Products,
  PlaidEnvironments,
  CountryCode,
  LinkTokenCreateRequest,
  IdentityVerificationCreateRequest,
  IdentityVerificationCreateResponse,
  IDNumberType,
  IdentityVerificationGetRequest,
  IdentityVerificationGetResponse,
  IdentityVerificationListRequest,
  IdentityVerificationListResponse,
  IdentityVerificationRetryRequest,
  Strategy,
  IdentityVerificationRetryResponse,
  IdentityVerificationRetryRequestStepsObject,
} from 'plaid';
import { IdentityVerification, User } from '@prisma/client';
import { LinkAccount, LinkSuccessMetadata } from './plaid.interface';
import { format } from 'date-fns';
import { CreatePlaidDto } from './dto/create-plaid.dto';
import { PrismaService } from 'src/prisma.service';

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
const PLAID_IDV_TEMPLATE_ID = process.env.PLAID_IDV_TEMPLATE_ID as string;
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
const plaidDto = new CreatePlaidDto();

@Injectable()
export class PlaidService {
  constructor(private prisma: PrismaService) {}

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
      const user = await this.prisma.user.findFirst({
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
        await this.prisma.user.update({
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
      const user = await this.prisma.user.findFirstOrThrow({
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
        await this.prisma.linkInstitution.upsert({
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
          await this.prisma.linkedAccount.createMany({
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
          await this.prisma.user.update({
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
      const user = await this.prisma.user.findFirst({
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
          await this.prisma.linkedAccount.update({
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
      const user = await this.prisma.user.findFirst({
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
        const linkedInstitutions = await this.prisma.linkInstitution.findMany({
          where: {
            plaidInstitutionId: {
              in: linkedInstitutionsIds,
            },
          },
        });
        const balances = await this.prisma.balances.findMany({
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

  async createIdentityVerification(userId: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          email: true,
          address: true,
          plaidUserId: true,
          idvUserConsent: true,
          dateOfBirth: true,
          givenName: true,
          familyName: true,
          documentId: true,
          identityVerification: true,
        },
      });

      // check if user exists
      if (!user) {
        throw new Error('User not found');
      }

      // check if user has given consent and has all the required data
      if (
        user.idvUserConsent === false ||
        user.dateOfBirth === null ||
        user.givenName === null ||
        user.familyName === null
      ) {
        throw new Error('User data not available');
      }

      // check if user already has an identity verification
      if (user.identityVerification && user.identityVerification.length > 0) {
        throw new Error('User already has an identity verification');
      }

      const request: IdentityVerificationCreateRequest = {
        secret: PLAID_SECRET,
        template_id: PLAID_IDV_TEMPLATE_ID,
        is_shareable: true,
        gave_consent: user.idvUserConsent || false,
        is_idempotent: true,
        user: {
          client_user_id: user.id.toString() || '',
          email_address: user.email,
          phone_number: user.phoneNumber,
          date_of_birth: format(new Date(user.dateOfBirth), 'yyyy-MM-dd'),
          name: {
            given_name: user.givenName,
            family_name: user.familyName,
          },
          address: {
            street: user.address?.street || '',
            street2: user.address?.street2 || '',
            city: user.address?.city || '',
            region: user.address?.region || '',
            postal_code: user.address?.postCode || '',
            country: user.address?.country || '',
          },
          id_number: {
            value: user.documentId?.value || '',
            type: (user.documentId?.type as IDNumberType) || null,
          },
        },
      };

      const convertedUser: User = plaidDto.userEntityToUserDto({
        ...user,
        createdAt: new Date().toISOString() || '',
        updatedAt: new Date().toISOString() || '',
        givenName: user.givenName || '',
        familyName: user.familyName || '',
        idvUserConsent: user.idvUserConsent || false,
        phoneNumberVerified: user.phoneNumberVerified || false,
        dateOfBirth: user.dateOfBirth || '',
        plaidUserId: user.plaidUserId || '',
        address: {
          ...user.address,
          id: Number(user.address?.id),
          street: user.address?.street || '',
          street2: user.address?.street2 || '',
          city: user.address?.city || '',
          postCode: user.address?.postCode || '',
          country: user.address?.country || '',
          state: user.address?.state || '',
          createdAt: user.address?.createdAt || '',
          updatedAt: user.address?.updatedAt || '',
          userId: user.address?.userId?.toString() || '',
        },
      });

      try {
        const response: IdentityVerificationCreateResponse = await client
          .identityVerificationCreate(request)
          .then((res) => {
            return res.data;
          });
        console.log('Idvresponse', response);
        // save response to db
        await this.saveIdvResponseToDb(convertedUser, response);

        return response;
      } catch (error) {
        throw new Error(error);
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async getIdentityVerification(userId: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          plaidUserId: true,
          identityVerification: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.plaidUserId === null) {
        throw new Error('User data not available');
      }

      const request: IdentityVerificationGetRequest = {
        // ID of the associated Identity verification attempt -> get this from create Idv request.
        identity_verification_id: '',
        secret: PLAID_SECRET,
        client_id: user.plaidUserId,
      };

      try {
        const response: IdentityVerificationGetResponse = await client
          .identityVerificationGet(request)
          .then((res) => res.data);
        return response;
      } catch (error) {
        throw new Error(error);
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async listIdentityVerification(userId: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          plaidUserId: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.plaidUserId === null) {
        throw new Error('User data not available');
      }

      const request: IdentityVerificationListRequest = {
        template_id: PLAID_IDV_TEMPLATE_ID,
        client_user_id: user.id.toString(),
      };

      try {
        const response: IdentityVerificationListResponse = await client
          .identityVerificationList(request)
          .then((res) => res.data);
        return response;
      } catch (error) {
        throw new Error(error);
      }
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async retryIdentityVerification(
    userId: number,
    retrySteps?: IdentityVerificationRetryRequestStepsObject,
  ) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          email: true,
          address: true,
          plaidUserId: true,
          idvUserConsent: true,
          dateOfBirth: true,
          givenName: true,
          familyName: true,
          documentId: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (
        user.phoneNumber === null ||
        user.givenName === null ||
        user.familyName === null ||
        user.documentId === null ||
        user.dateOfBirth === null ||
        user.plaidUserId === null
      ) {
        throw new Error('User data not available');
      }

      const request: IdentityVerificationRetryRequest = {
        template_id: PLAID_IDV_TEMPLATE_ID,
        client_user_id: user.id.toString() || '',
        secret: PLAID_SECRET,
        client_id: user.plaidUserId || '',
        strategy: Strategy.Reset,
        steps: retrySteps,
      };

      // convert to User type
      const convertedUser: User = plaidDto.userEntityToUserDto({
        ...user,
        createdAt: new Date().toISOString() || '',
        updatedAt: new Date().toISOString() || '',
        givenName: user.givenName || '',
        familyName: user.familyName || '',
        idvUserConsent: user.idvUserConsent || false,
        phoneNumberVerified: user.phoneNumberVerified || false,
        dateOfBirth: user.dateOfBirth || '',
        plaidUserId: user.plaidUserId || '',
        address: {
          ...user.address,
          id: Number(user.address?.id),
          street: user.address?.street || '',
          street2: user.address?.street2 || '',
          city: user.address?.city || '',
          postCode: user.address?.postCode || '',
          country: user.address?.country || '',
          state: user.address?.state || '',
          createdAt: user.address?.createdAt || '',
          updatedAt: user.address?.updatedAt || '',
          userId: user.address?.userId?.toString() || '',
        },
      });

      // get retry response
      const response: IdentityVerificationRetryResponse = await client
        .identityVerificationRetry(request)
        .then((res) => res.data);

      // save response to db
      await this.saveIdvResponseToDb(convertedUser, response);

      return response;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async saveIdvResponseToDb(user: User, response: any) {
    try {
      // update user
      const updatedUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          plaidUserId: response.user.client_id,
          kycIPAddress: response.user.kyc_ip_address,
          givenName: response.user.name.given_name,
          familyName: response.user.name.family_name,
          address: {
            update: {
              street: response.user.address.street,
              street2: response.user.address.street2,
              city: response.user.address.city,
              postCode: response.user.address.postal_code,
              country: response.user.address.country,
            },
          },
        },
        select: {
          identityVerification: true,
          kycStatus: true,
          plaidUserId: true,
        },
      });

      if (!updatedUser) {
        throw new Error('User not found');
      }

      let updatedIdv: IdentityVerification | null = null;

      if (
        updatedUser.identityVerification &&
        updatedUser.identityVerification.length > 0
      ) {
        if (
          updatedUser.identityVerification.find(
            (idv) => idv.plaidIdvId === response.id,
          )
        ) {
          updatedIdv = await this.prisma.identityVerification.update({
            where: {
              plaidIdvId: response.id,
              userId: user.id,
            },
            data: {
              plaidIdvId: response.id,
              plaidUserId: user.plaidUserId || '',
              template: {
                update: {
                  plaidTemplateId: response.template.id,
                  version: response.template.version,
                },
              },
              verificationStatus: response.status,
              shareable_url: response.shareable_url,
              watchlist_screening_id: response.watchlist_screening_id,
              redacted_at: response.redacted_at,
              request_id: response.request_id,
              updatedAt: new Date().toISOString(),
            },
          });
        } else {
          updatedIdv = await this.prisma.identityVerification.create({
            data: {
              plaidIdvId: response.id,
              plaidUserId: user.plaidUserId || '',
              template: {
                create: {
                  plaidTemplateId: response.template.id,
                  version: response.template.version,
                },
              },
              verificationStatus: response.status,
              shareable_url: response.shareable_url,
              watchlist_screening_id: response.watchlist_screening_id,
              redacted_at: response.redacted_at,
              request_id: response.request_id,
              updatedAt: new Date().toISOString(),
              user: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
        }
      }

      return { updatedUser, updatedIdv };
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
