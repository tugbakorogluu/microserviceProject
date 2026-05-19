import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly packageServiceUrl = 'http://package-service:3001/packages';
  private readonly notificationServiceUrl = 'http://notification-service:3003/notifications';

  private readonly statusFlow = {
    'Hazırlanıyor': 'Yolda',
    'Yolda': 'Dağıtımda',
    'Dağıtımda': 'Teslim Edildi',
  };

  constructor(private readonly httpService: HttpService) {}

  @Cron('*/5 * * * * *') // Runs every 5 seconds
  async handleCron() {
    try {
      // Fetch non-delivered packages
      const response = await firstValueFrom(
        this.httpService.get(`${this.packageServiceUrl}/not-delivered`)
      );
      
      const packages = response.data;
      if (!packages || packages.length === 0) {
        return;
      }

      for (const pkg of packages) {
        const nextStatus = this.statusFlow[pkg.status];
        if (nextStatus) {
          // Update status in package-service
          await firstValueFrom(
            this.httpService.put(`${this.packageServiceUrl}/${pkg.id}/status`, {
              status: nextStatus,
            })
          );
          this.logger.log(`Package ${pkg.id} status updated to: ${nextStatus}`);

          // Trigger notification if delivered
          if (nextStatus === 'Teslim Edildi') {
            await this.notifyDelivery(pkg);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in tracking cron job:', error.message);
    }
  }

  private async notifyDelivery(pkg: any) {
    try {
      await firstValueFrom(
        this.httpService.post(this.notificationServiceUrl, {
          packageId: pkg.id,
          receiverName: pkg.receiver,
          message: 'Teslim Edildi',
        })
      );
      this.logger.log(`Notification sent for package ${pkg.id}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for package ${pkg.id}:`, error.message);
    }
  }
}
