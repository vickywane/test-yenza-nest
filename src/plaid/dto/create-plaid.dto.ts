import { AuthMethod, User } from '@prisma/client';
import {
  UserEntity,
  AuthMethod as AuthMethodEntity,
  KYCStatus as KYCStatusEntity,
} from '../entities/plaid.entity';

export class CreatePlaidDto {
  userEntityToUserDto = (userEntity: UserEntity): User => {
    return {
      id: Number(userEntity.id),
      authId: userEntity.authId || null,
      authMethod: AuthMethod.AWS_COGNITO,
      givenName: userEntity.givenName || null,
      familyName: userEntity.familyName || null,
      email: userEntity.email || '',
      idvUserConsent: userEntity.idvUserConsent || false,
      idvUserConsentDate: userEntity.idvUserConsentDate || null,
      idvUserId: userEntity.idvUserId || null,
      phoneNumber: userEntity.phoneNumber,
      phoneNumberVerified: userEntity.phoneNumberVerified || false,
      emailVerified: userEntity.emailVerified || false,
      kycStatus: userEntity.kycStatus || null,
      dateOfBirth: userEntity.dateOfBirth || null,
      addressId: userEntity.addressId || null,
      plaidPublicToken: userEntity.plaidPublicToken || null,
      plaidAccessToken: userEntity.plaidAccessToken || null,
      createdAt: new Date(userEntity.createdAt),
      updatedAt: new Date(userEntity.updatedAt),
      kycIPAddress: userEntity.kycIPAddress || null, // Add missing property
      plaidUserId: userEntity.plaidUserId || null, // Add missing property
    };
  };

  userDtoToUserEntity = (user: User): UserEntity => {
    return {
      id: user.id,
      authId: user.authId || '',
      authMethod: (user.authMethod ||
        AuthMethodEntity.AWS_COGNITO) as AuthMethodEntity,
      givenName: user.givenName || '',
      familyName: user.familyName || '',
      email: user.email || '',
      idvUserConsent: user.idvUserConsent || false,
      idvUserConsentDate: user.idvUserConsentDate || '',
      idvUserId: user.idvUserId || '',
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified || false,
      emailVerified: user.emailVerified || false,
      kycStatus: (user.kycStatus ||
        KYCStatusEntity.UNVERIFIED) as KYCStatusEntity,
      dateOfBirth: user.dateOfBirth || '',
      addressId: user.addressId || '',
      plaidPublicToken: user.plaidPublicToken || '',
      plaidAccessToken: user.plaidAccessToken || '',
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
      kycIPAddress: user.kycIPAddress || '',
      plaidUserId: user.plaidUserId || '',
    };
  };
}
