import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';
import { Package, PackageSchema } from './schemas/package.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }])],
  controllers: [PackageController],
  providers: [PackageService],
})
export class PackageModule {}
