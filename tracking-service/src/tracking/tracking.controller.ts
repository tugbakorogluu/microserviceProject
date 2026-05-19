import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TrackingService } from './tracking.service';
import { PackageCreatedEvent } from './tracking.dto';

@Controller('trackings')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * RabbitMQ Event Handler: package.created
   * NestJS microservices SADECE controller'ları tarar — service'teki @EventPattern çalışmıyordu.
   */
  @EventPattern('package.created')
  async handlePackageCreated(@Payload() event: PackageCreatedEvent) {
    return this.trackingService.handlePackageCreated(event);
  }

  /**
   * Get tracking by barcode
   * GET /trackings/:barcode
   */
  @Get(':barcode')
  @HttpCode(HttpStatus.OK)
  async getByBarcode(@Param('barcode') barcode: string) {
    if (!barcode || barcode.trim() === '') {
      throw new BadRequestException('Barcode is required');
    }
    return await this.trackingService.getTrackingByBarcode(barcode);
  }

  /**
   * Get all trackings
   * GET /trackings
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return await this.trackingService.getAllTrackings();
  }

  /**
   * Get trackings by status
   * GET /trackings/status/:status
   */
  @Get('status/:status')
  @HttpCode(HttpStatus.OK)
  async getByStatus(@Param('status') status: string) {
    if (!status || status.trim() === '') {
      throw new BadRequestException('Status is required');
    }
    return await this.trackingService.getTrackingByStatus(status);
  }

  /**
   * Health check endpoint
   * GET /trackings/health/check
   */
  @Get('health/check')
  @HttpCode(HttpStatus.OK)
  health() {
    return this.trackingService.getHealth();
  }
}
