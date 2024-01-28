import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserDto } from 'src/dto/user.dto';
import { UserKYCDto } from 'src/dto/kyc.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUser(user: Partial<Pick<UserDto, 'email' | 'phoneNumber' | 'id'>>) {
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
    userId: number;
    kycDetails: UserKYCDto;
  }) {
    try {
      const userExist = await this.getUser({ id: userId });

      if (!userExist) {
        throw new Error('User not found!');
      }

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
          userId
        },
      });

      return await this.prisma?.documentId.upsert({
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
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
