import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  sender: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  receiver: string;
}

export class PackageCreatedEvent {
  barcode: string;
  sender: string;
  receiver: string;
  status: string;
  createdAt: Date;
}
