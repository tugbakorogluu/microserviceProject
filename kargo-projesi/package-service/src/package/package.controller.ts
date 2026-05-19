import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageStatusDto } from './dto/update-package-status.dto';

@Controller('packages')
export class PackageController {
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
}
