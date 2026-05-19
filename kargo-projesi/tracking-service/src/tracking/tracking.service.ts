import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async advancePackage(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.packageServiceUrl}/${id}`)
      );
      
      const pkg = response.data;
      if (!pkg) {
        throw new NotFoundException(`Package ${id} not found`);
      }

      if (pkg.status === 'Teslim Edildi') {
        return { message: 'Package is already delivered', pkg };
      }

      const nextStatus = this.statusFlow[pkg.status];
      if (nextStatus) {
        const updateResponse = await firstValueFrom(
          this.httpService.put(`${this.packageServiceUrl}/${pkg.id || pkg._id}/status`, {
            status: nextStatus,
          })
        );
        this.logger.log(`Package ${id} status updated to: ${nextStatus}`);
        
        const updatedPkg = updateResponse.data;

        if (nextStatus === 'Teslim Edildi') {
          await this.notifyDelivery(updatedPkg);
        }

        return updatedPkg;
      }
      return pkg;
    } catch (error) {
      this.logger.error(`Error advancing package ${id}:`, error.message);
      throw error;
    }
  }

  private async notifyDelivery(pkg: any) {
    try {
      await firstValueFrom(
        this.httpService.post(this.notificationServiceUrl, {
          packageId: pkg.id || pkg._id,
          receiverName: pkg.receiver,
          message: 'Teslim Edildi',
        })
      );
      this.logger.log(`Notification sent for package ${pkg.id || pkg._id}`);
    } catch (error) {
      this.logger.error(`Failed to send notification for package ${pkg.id || pkg._id}:`, error.message);
    }
  }
}
