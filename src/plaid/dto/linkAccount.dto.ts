import { IsNotEmpty, IsString } from 'class-validator';
import { LinkSuccessMetadata } from '../plaid.interface';

export class LinkAccountDto {
  @IsString()
  @IsNotEmpty()
  publicToken: string;

  metadata: LinkSuccessMetadata;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
