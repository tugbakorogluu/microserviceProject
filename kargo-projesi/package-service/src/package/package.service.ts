import { Injectable, NotFoundException, Inject, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Package, PackageDocument } from './schemas/package.schema';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageStatusDto } from './dto/update-package-status.dto';

@Injectable()
export class PackageService {
  private readonly logger = new Logger(PackageService.name);

  constructor(
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    @Optional() @Inject('NOTIFICATION_SERVICE') private notificationClient?: ClientProxy,
  ) {}

  async create(createPackageDto: CreatePackageDto): Promise<Package> {
    const createdPackage = new this.packageModel(createPackageDto);
    const result = await createdPackage.save();
    this.logger.log(`Package created: ${result._id}`);
    return result;
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

    this.logger.log(`Package ${id} status updated to: ${updatePackageStatusDto.status}`);

    // Emit notification event if delivered
    if (updatePackageStatusDto.status === 'Teslim Edildi' && this.notificationClient) {
      try {
        this.notificationClient.emit('package_delivered', {
          packageId: updatedPackage.id || updatedPackage._id,
          receiverName: updatedPackage.receiver,
          message: 'Teslim Edildi',
        });
        this.logger.log(`Notification event emitted for package ${id}`);
      } catch (error) {
        this.logger.error(`Error emitting notification: ${error.message}`);
      }
    }

    return updatedPackage;
  }
}
