import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const leslie = await prisma.user.upsert({
    where: { email: 'leslie@prisma.io' },
    update: {},
    create: {
      email: 'leslie@prisma.io',
      givenName: 'Leslie',
      familyName: 'Knope',
      phoneNumber: '+12345678909',
      phoneNumberVerified: true,
      emailVerified: true,
      idvUserConsent: true,
      dateOfBirth: '1975-01-18',
      idvUserConsentDate: new Date().toISOString(),
      address: {
        create: {
          street: '123 Main St',
          street2: 'Apt 1',
          city: 'Pawnee',
          region: 'IN',
          postCode: '46001',
          country: 'US',
        },
      },
      documentId: {
        create: {
          type: 'us_ssn',
          value: '123456789',
          updatedAt: new Date().toISOString(),
        },
      },
    },
  });
  console.log({ leslie });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
