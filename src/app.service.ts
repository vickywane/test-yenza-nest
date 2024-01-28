import { Injectable } from '@nestjs/common';
import { SignUpUser } from './plaid/plaid.interface';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

@Injectable()
export class AppService {
  async createNewUser(user: SignUpUser) {
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
