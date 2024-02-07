import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from 'src/dto/user.dto';
import { UserKYCDto } from 'src/dto/kyc.dto';
import { v4 as uuidv4 } from 'uuid';
import { PlaidService } from 'src/plaid/plaid.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private plaid: PlaidService,
  ) {}

  async getUser(
    user: Partial<Pick<UserDto, 'email' | 'phoneNumber'> & { id: string }>,
  ) {
    try {
      const userExist = await this.prisma?.user.findFirst({
        where: {
          OR: [
            {
              phoneNumber: user.phoneNumber,
            },
            {
              email: user.email,
            },
            {
              id: user.id,
            },
          ],
        },
      });

      return userExist;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async createNewUser(user: UserDto) {
    try {
      const userExist = await this.getUser({
        phoneNumber: user.phoneNumber,
        email: user.phoneNumber,
      });

      if (userExist) {
        throw new Error('User already exist');
      }

      return await this.prisma?.user.create({
        data: {
          id: uuidv4(),
          email: user.email,
          phoneNumber: user.phoneNumber,
          idvUserConsent: true,
          dateOfBirth: user?.dateOfBirth,
          countryCode: user.countryCode,
          authMethod: 'NATIVE_AUTH',
          familyName: `${user.firstName} ${user.lastName}`,
          givenName: `${user.firstName} ${user.lastName}`,
        },
      });
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  async insertUserKYC({
    userId,
    kycDetails,
  }: {
    userId: string;
    kycDetails: UserKYCDto;
  }) {
    try {
      const userExist = await this.getUser({ id: userId });

      if (!userExist) {
        throw new Error('User not found!');
      }

      // update address table
      await this.prisma?.address.upsert({
        where: {
          userId,
        },
        update: {
          street: kycDetails.address,
          postCode: kycDetails.postCode,
          country: kycDetails.countryCode,
        },
        create: {
          street: kycDetails.address,
          postCode: kycDetails.postCode,
          country: kycDetails.countryCode,
          userId,
        },
      });

      // update document table
      await this.prisma?.documentId.upsert({
        where: {
          userId,
        },
        update: {
          value: kycDetails.documentNumber,
          type: kycDetails.documentType,
        },
        create: {
          value: kycDetails.documentNumber,
          type: kycDetails.documentType,
          userId,
        },
      });

      const updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          idvUserConsent: kycDetails.kycConsent,
          idvUserConsentDate: new Date().toISOString(),
          countryCode: kycDetails.countryCode,
        },
      });

      try {
        await this.plaid.createIdentityVerification(userId);
      } catch (error) {
        console.log('plaid-kyc-error', error);
      }

      return updatedUser;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
