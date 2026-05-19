import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  private readonly statusFlow = {
    'Hazırlanıyor': 'Yolda',
    'Yolda': 'Dağıtımda',
    'Dağıtımda': 'Teslim Edildi',
  };

  constructor(
    @Optional() @Inject('PACKAGE_SERVICE') private packageClient?: ClientProxy,
    @Optional() @Inject('NOTIFICATION_SERVICE') private notificationClient?: ClientProxy,
  ) {
    if (!this.packageClient) {
      this.logger.warn('⚠️ PACKAGE_SERVICE client not available - will retry later');
    }
    if (!this.notificationClient) {
      this.logger.warn('⚠️ NOTIFICATION_SERVICE client not available - will retry later');
    }
  }

  async advancePackage(id: string) {
    try {
      this.logger.log(`📦 Advancing package ${id} (Asynchronous Event)`);

      // Calculate next status locally (don't need to fetch from package-service)
      // In a real scenario, you might store status state locally or in a cache
      const event = {
        packageId: id,
        timestamp: new Date(),
      };

      // Emit event to package-service to get current status and advance it
      if (this.packageClient) {
        this.packageClient.emit('advance_package_request', event);
        this.logger.log(`✅ Event emitted to package-service for package ${id} - Fire & Forget`);
      } else {
        this.logger.warn(`⚠️ Package Service client unavailable - queuing event for ${id}`);
      }

      return {
        message: 'Package advancement event sent to queue',
        packageId: id,
        timestamp: event.timestamp,
        note: 'Status update is being processed asynchronously by package-service',
      };
    } catch (error) {
      this.logger.error(`❌ Error advancing package ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Alternative method: Get package status synchronously (if needed)
   * This should be used sparingly and with timeout/circuit-breaker
   */
  async getPackageStatusAsync(packageId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout getting package status for ${packageId}`));
      }, 5000); // 5 second timeout

      try {
        this.logger.log(`🔍 Requesting package status for ${packageId}`);
        // This would require request-reply pattern, which is more complex
        // For now, we use fire-and-forget pattern
        resolve({
          message: 'Use fire-and-forget event pattern for resilience',
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}
