import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { PackageDeliveredEvent } from './notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * RabbitMQ Event Handler: package.delivered
   * NestJS microservices SADECE controller'ları tarar — service'teki @EventPattern çalışmıyordu.
   */
  @EventPattern('package.delivered')
  async handlePackageDelivered(@Payload() event: PackageDeliveredEvent) {
    return this.notificationsService.handlePackageDelivered(event);
  }

  /**
   * Get notifications by barcode
   * GET /notifications/barcode/:barcode
   */
  @Get('barcode/:barcode')
  @HttpCode(HttpStatus.OK)
  async getByBarcode(@Param('barcode') barcode: string) {
    if (!barcode || barcode.trim() === '') {
      throw new BadRequestException('Barcode is required');
    }
    return await this.notificationsService.getNotificationsByBarcode(barcode);
  }

  /**
   * Get all notifications
   * GET /notifications
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return await this.notificationsService.getAllNotifications();
  }

  /**
   * Get notifications by status
   * GET /notifications/status/:status
   */
  @Get('status/:status')
  @HttpCode(HttpStatus.OK)
  async getByStatus(@Param('status') status: string) {
    if (!status || status.trim() === '') {
      throw new BadRequestException('Status is required');
    }
    return await this.notificationsService.getNotificationsByStatus(status);
  }

  /**
   * Get notification statistics
   * GET /notifications/stats/all
   */
  @Get('stats/all')
  @HttpCode(HttpStatus.OK)
  async getStatistics() {
    return await this.notificationsService.getStatistics();
  }

  /**
   * Health check endpoint
   * GET /notifications/health/check
   */
  @Get('health/check')
  @HttpCode(HttpStatus.OK)
  health() {
    return this.notificationsService.getHealth();
  }
}
