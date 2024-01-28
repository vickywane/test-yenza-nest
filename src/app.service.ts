import { Injectable } from '@nestjs/common';
import { SignUpUser } from './plaid/plaid.interface';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  async createNewUser(user: SignUpUser) {
    try {
      const userExist = !!(await this.prisma.user.findFirst({
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

      const newUser = await this.prisma.user.create({
        data: {
          // givenName: user.givenName || '',
          // familyName: user.familyName || '',
          email: user.email,
          phoneNumber: user.phoneNumber,
          // dateOfBirth: user.dateOfBirth || '',
        },
      });

      // if (user.address) {
      //   await prisma.address.upsert({
      //     where: {
      //       userId: newUser.id,
      //     },
      //     update: {
      //       street: user.address.street,
      //       street2: user.address.street2,
      //       city: user.address.city,
      //       state: user.address.state,
      //       postCode: user.address.postCode,
      //       country: user.address.country,
      //     },
      //     create: {
      //       street: user.address.street,
      //       street2: user.address.street2 || '',
      //       city: user.address.city,
      //       state: user.address.state,
      //       postCode: user.address.postCode,
      //       userId: newUser.id,
      //       country: user.address.country,
      //     },
      //   });
      // }

      return newUser;
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }
}
