import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

type DOCUMENT_TYPE = 'PASSPORT' | 'DRIVING_LICENSE';

export class UserKYCDto {
  @IsString()
  @IsNotEmpty()
  postCode: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  documentType: DOCUMENT_TYPE;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @IsBoolean()
  @IsNotEmpty()
  kycConsent: boolean;
}
