import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Package, PackageDocument } from './schemas/package.schema';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageStatusDto } from './dto/update-package-status.dto';

@Injectable()
export class PackageService {
  constructor(
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
  ) {}

  async create(createPackageDto: CreatePackageDto): Promise<Package> {
    const createdPackage = new this.packageModel(createPackageDto);
    return createdPackage.save();
  }

  async findAll(): Promise<Package[]> {
    return this.packageModel.find().exec();
  }
  
  async findNotDelivered(): Promise<Package[]> {
    return this.packageModel.find({ status: { $ne: 'Teslim Edildi' } }).exec();
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.packageModel.findOne({ id }).exec();
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return pkg;
  }

  async updateStatus(id: string, updatePackageStatusDto: UpdatePackageStatusDto): Promise<Package> {
    const updatedPackage = await this.packageModel.findOneAndUpdate(
      { id },
      { status: updatePackageStatusDto.status },
      { new: true },
    ).exec();
    
    if (!updatedPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return updatedPackage;
  }
}
