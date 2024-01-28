import { LinkAccountVerificationStatus } from 'src/plaid/plaid.interface';
export interface UserEntity {
  id?: number;
  authId?: string;
  authMethod?: AuthMethod;
  countryCode: string;
  givenName: string;
  familyName: string;
  email?: string;
  idvUserConsent?: boolean;
  idvUserConsentDate?: string;
  idvUserId?: string;
  phoneNumber: string;
  phoneNumberVerified?: boolean;
  emailVerified?: boolean;
  kycStatus?: KYCStatus;
  dateOfBirth?: string;
  addressId?: string;
  address?: Address;
  linkedAccounts?: LinkedAccountEntity[];
  linkedInstitutions?: LinkInstitutionEntity[];
  plaidPublicToken?: string;
  plaidAccessToken?: string;
  kycIPAddress?: string;
  plaidUserId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LinkedAccountEntity {
  id?: number;
  plaidAccountId: string;
  countryCode: string;
  userId: string;
  name: string;
  officialName: string;
  mask: string;
  type: string;
  subtype: string;
  linkInstitutionId: string;
  verificationStatus: LinkAccountVerificationStatus;
  updatedAt: string | Date;
  createdAt: string | Date;
  balances: {
    available: number;
    current: number;
    limit: number;
    isoCurrencyCode: string;
    unofficialCurrencyCode: string;
    plaidAccountId: string;
  };
}

export interface LinkInstitutionEntity {
  id?: number;
  plaidInstitutionId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export enum KYCStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AuthMethod {
  AWS_COGNITO = 'aws_cognito',
}

export interface Address {
  id?: number;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}
