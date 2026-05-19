import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './packages.dto';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  /**
   * Create a new package
   * POST /packages
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPackageDto: CreatePackageDto) {
    if (!createPackageDto.sender || !createPackageDto.receiver) {
      throw new BadRequestException(
        'Sender and receiver are required fields',
      );
    }
    return await this.packagesService.createPackage(createPackageDto);
  }

  /**
   * Get package by barcode
   * GET /packages/:barcode
   */
  @Get(':barcode')
  @HttpCode(HttpStatus.OK)
  async getByBarcode(@Param('barcode') barcode: string) {
    if (!barcode || barcode.trim() === '') {
      throw new BadRequestException('Barcode is required');
    }
    return await this.packagesService.getPackageByBarcode(barcode);
  }

  /**
   * Get all packages
   * GET /packages
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return await this.packagesService.getAllPackages();
  }

  /**
   * Health check endpoint
   * GET /packages/health
   */
  @Get('health/check')
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
      service: 'package-service',
      timestamp: new Date(),
    };
  }
}
