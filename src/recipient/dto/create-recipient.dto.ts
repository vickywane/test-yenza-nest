import { AbstractDto } from '../../dto/abstract.dto';

export class CreateRecipientDto extends AbstractDto {
  firstName: string;
  lastName: string;
  accountName: string;
  accountNumber: string;
  country: string;
  currency: string;
  countryName: string;
  type: string;
  bank: string;
  phone: string;
  userId?: string;
}
