import {
  Address,
  AuthMethod,
  KYCStatus,
  LinkInstitution,
  LinkedAccount,
} from '@prisma/client';

export interface User {
  id?: number;
  authId?: string;
  authMethod?: AuthMethod;
  givenName: string;
  familyName: string;
  email?: string;
  idvUserConsent?: boolean;
  idvUserConsentDate?: string | Date;
  idvUserId?: string;
  phoneNumber: string;
  phoneNumberVerified?: boolean;
  emailVerified?: string;
  kycStatus?: KYCStatus;
  dateOfBirth?: string | Date;
  addressId?: string;
  address?: Address;
  linkedAccounts?: LinkedAccount[];
  linkedInstitutions?: LinkInstitution[];
  plaidPublicToken?: string;
  plaidAccessToken?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
