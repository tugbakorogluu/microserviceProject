import { Controller, Get, Post, Body, Param, Put, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageStatusDto } from './dto/update-package-status.dto';

@Controller('packages')
export class PackageController {
  private readonly logger = new Logger(PackageController.name);

  constructor(private readonly packageService: PackageService) {}

  @Post()
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packageService.create(createPackageDto);
  }

  @Get()
  findAll() {
    return this.packageService.findAll();
  }

  @Get('not-delivered')
  findNotDelivered() {
    return this.packageService.findNotDelivered();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() updatePackageStatusDto: UpdatePackageStatusDto) {
    return this.packageService.updateStatus(id, updatePackageStatusDto);
  }

  // RabbitMQ Message Handler - Listen for status update events
  @EventPattern('update_package_status')
  async handleUpdatePackageStatus(@Payload() data: any) {
    this.logger.log(`Received update_package_status event: ${JSON.stringify(data)}`);
    try {
      const result = await this.packageService.updateStatus(data.packageId, {
        status: data.status,
      });
      this.logger.log(`Package ${data.packageId} status updated to: ${data.status}`);
      return result;
    } catch (error) {
      this.logger.error(`Error handling update_package_status: ${error.message}`);
      throw error;
    }
  }

  // RabbitMQ Message Handler - Listen for advance package requests from tracking-service
  @EventPattern('advance_package_request')
  async handleAdvancePackageRequest(@Payload() data: any) {
    this.logger.log(`🚀 Received advance_package_request from tracking-service for package: ${data.packageId}`);
    try {
      const pkg = await this.packageService.findOne(data.packageId);
      
      if (!pkg) {
        this.logger.error(`Package ${data.packageId} not found`);
        return { error: 'Package not found', packageId: data.packageId };
      }

      if (pkg.status === 'Teslim Edildi') {
        this.logger.log(`Package ${data.packageId} is already delivered`);
        return { message: 'Already delivered', packageId: data.packageId, status: pkg.status };
      }

      // Define status flow
      const statusFlow = {
        'Hazırlanıyor': 'Yolda',
        'Yolda': 'Dağıtımda',
        'Dağıtımda': 'Teslim Edildi',
      };

      const nextStatus = statusFlow[pkg.status];
      if (nextStatus) {
        const updated = await this.packageService.updateStatus(data.packageId, { status: nextStatus });
        this.logger.log(`✅ Package ${data.packageId} advanced to: ${nextStatus}`);
        return updated;
      }

      return pkg;
    } catch (error) {
      this.logger.error(`Error handling advance_package_request: ${error.message}`);
      throw error;
    }
  }
}
