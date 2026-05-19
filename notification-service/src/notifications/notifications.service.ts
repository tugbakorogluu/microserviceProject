import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notifications.schema';
import { PackageDeliveredEvent } from './notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * package.delivered event'ini işle — bildirim oluştur ve kaydet.
   * Bu metod controller tarafından çağrılır (@EventPattern controller'da).
   */
  async handlePackageDelivered(event: PackageDeliveredEvent) {
    try {
      this.logger.log(
        `📥 Received package.delivered event: ${event.barcode}`,
      );

      // Create notification message
      const messageContent = `🚨 Sayın Müşteri, ${event.barcode} numaralı kargonuz teslim edilmiştir!`;

      // Log to console as required
      console.log(`\n🚨 Sayın Müşteri, ${event.barcode} numaralı kargonuz teslim edilmiştir!\n`);

      // Save notification to database
      const notification = new this.notificationModel({
        barcode: event.barcode,
        messageContent,
        sentAt: new Date(),
        deliveryStatus: 'Sent',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedNotification = await notification.save();
      this.logger.log(
        `✅ Notification saved for barcode: ${event.barcode}`,
      );

      return {
        success: true,
        data: savedNotification,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error handling package.delivered event: ${error.message}`,
      );
      // Save failed notification
      await this.saveFailedNotification(event.barcode, error.message);
    }
  }

  /**
   * Save failed notification
   */
  private async saveFailedNotification(barcode: string, errorMessage: string) {
    try {
      const notification = new this.notificationModel({
        barcode,
        messageContent: `Failed to send delivery notification: ${errorMessage}`,
        sentAt: new Date(),
        deliveryStatus: 'Failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await notification.save();
      this.logger.log(`⚠️ Failed notification saved for barcode: ${barcode}`);
    } catch (error) {
      this.logger.error(
        `❌ Error saving failed notification: ${error.message}`,
      );
    }
  }

  /**
   * Get notifications by barcode
   */
  async getNotificationsByBarcode(barcode: string): Promise<any> {
    try {
      const notifications = await this.notificationModel.find({ barcode });
      return {
        success: true,
        count: notifications.length,
        data: notifications,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error fetching notifications: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all notifications
   */
  async getAllNotifications(): Promise<any> {
    try {
      const notifications = await this.notificationModel
        .find()
        .sort({ sentAt: -1 });
      return {
        success: true,
        count: notifications.length,
        data: notifications,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error fetching all notifications: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get notifications by delivery status
   */
  async getNotificationsByStatus(status: string): Promise<any> {
    try {
      const notifications = await this.notificationModel.find({
        deliveryStatus: status,
      });
      return {
        success: true,
        count: notifications.length,
        data: notifications,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error fetching notifications by status: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const total = await this.notificationModel.countDocuments();
      const sent = await this.notificationModel.countDocuments({
        deliveryStatus: 'Sent',
      });
      const failed = await this.notificationModel.countDocuments({
        deliveryStatus: 'Failed',
      });
      const pending = await this.notificationModel.countDocuments({
        deliveryStatus: 'Pending',
      });

      return {
        success: true,
        statistics: {
          total,
          sent,
          failed,
          pending,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error getting statistics: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Health check
   */
  getHealth() {
    return {
      status: 'healthy',
      service: 'notification-service',
      timestamp: new Date(),
    };
  }
}
