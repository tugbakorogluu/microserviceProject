import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Tracking, TrackingDocument } from './tracking.schema';
import { PackageCreatedEvent, PackageDeliveredEvent } from './tracking.dto';

@Injectable()
export class TrackingService implements OnModuleInit {
  private readonly logger = new Logger(TrackingService.name);
  private simulationIntervals: Map<string, NodeJS.Timeout> = new Map();

  private readonly statusFlow = [
    'Hazırlanıyor',
    'Yolda',
    'Dağıtımda',
    'Teslim Edildi',
  ];

  constructor(
    @InjectModel(Tracking.name) private trackingModel: Model<TrackingDocument>,
    @Inject('NOTIFICATION_CLIENT') private notificationClient: ClientProxy,
  ) {}

  /**
   * Initialize service: RabbitMQ bağlantısını başlat ve mevcut paketler için simülasyonu başlat.
   * Bağlantı hatası bu servisi çöktürmez.
   */
  async onModuleInit() {
    // RabbitMQ bağlantısını graceful başlat
    try {
      await this.notificationClient.connect();
      this.logger.log('✅ NOTIFICATION_CLIENT connected to RabbitMQ');
    } catch (error) {
      this.logger.warn(
        `⚠️ Initial RabbitMQ connection failed, will retry on emit: ${error.message}`,
      );
    }

    this.logger.log('🚀 Initializing Tracking Service simulation...');
    await this.startSimulationForExistingPackages();
  }

  /**
   * package.created event'ini işle — tracking kaydı oluştur ve simülasyonu başlat.
   * Bu metod controller tarafından çağrılır (@EventPattern controller'da).
   */
  async handlePackageCreated(event: PackageCreatedEvent) {
    try {
      this.logger.log(`📥 Received package.created event: ${event.barcode}`);

      // Check if tracking already exists
      const existingTracking = await this.trackingModel.findOne({
        barcode: event.barcode,
      });

      if (existingTracking) {
        this.logger.warn(
          `⚠️ Tracking already exists for barcode: ${event.barcode}`,
        );
        return;
      }

      // Create tracking record
      const tracking = new this.trackingModel({
        barcode: event.barcode,
        currentStatus: 'Hazırlanıyor',
        sender: event.sender,
        receiver: event.receiver,
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveryEventPublished: false,
      });

      const savedTracking = await tracking.save();
      this.logger.log(`✅ Tracking created for barcode: ${event.barcode}`);

      // Start status simulation for this package
      this.startStatusSimulation(event.barcode);
    } catch (error) {
      this.logger.error(
        `❌ Error handling package.created event: ${error.message}`,
      );
    }
  }

  /**
   * Start status simulation for a specific package
   * Automatically transitions package through statuses, resuming from the current status if provided
   */
  private startStatusSimulation(barcode: string, currentStatus?: string) {
    const simulationInterval = parseInt(
      process.env.STATUS_SIMULATION_INTERVAL || '10000',
    );

    // Clear existing interval if any
    if (this.simulationIntervals.has(barcode)) {
      clearInterval(this.simulationIntervals.get(barcode));
    }

    // Belirtilen statünün index'ini bul, eğer yoksa veya geçersizse 0'dan (Hazırlanıyor) başla.
    // Eğer paket zaten belirli bir statüde ise (örn: "Yolda" - index 1), bir sonraki durumdan (index 2 - "Dağıtımda") devam etmeli.
    let currentStatusIndex = 0;
    if (currentStatus) {
      const index = this.statusFlow.indexOf(currentStatus);
      if (index !== -1) {
        currentStatusIndex = index + 1;
      }
    }

    const intervalId = setInterval(async () => {
      try {
        if (currentStatusIndex < this.statusFlow.length) {
          const newStatus = this.statusFlow[currentStatusIndex];
          const tracking = await this.trackingModel.findOneAndUpdate(
            { barcode },
            {
              currentStatus: newStatus,
              updatedAt: new Date(),
              ...(newStatus === 'Teslim Edildi' && {
                deliveredAt: new Date(),
              }),
            },
            { new: true },
          );

          this.logger.log(
            `📦 Status updated: ${barcode} -> ${newStatus}`,
          );

          // If delivered, publish event and cleanup
          if (newStatus === 'Teslim Edildi') {
            await this.publishDeliveryEvent(tracking);
            clearInterval(intervalId);
            this.simulationIntervals.delete(barcode);
            this.logger.log(
              `🎉 Simulation completed for barcode: ${barcode}`,
            );
          }

          currentStatusIndex++;
        } else {
          // Eğer akış tamamlandıysa ama interval hala açık kaldıysa temizle
          clearInterval(intervalId);
          this.simulationIntervals.delete(barcode);
        }
      } catch (error) {
        this.logger.error(
          `❌ Error in simulation for ${barcode}: ${error.message}`,
        );
      }
    }, simulationInterval);

    this.simulationIntervals.set(barcode, intervalId);
    this.logger.log(
      `⏱️ Simulation started/resumed for barcode: ${barcode} (current status: ${currentStatus || 'Hazırlanıyor'}, interval: ${simulationInterval}ms)`,
    );
  }

  /**
   * Publish package.delivered event to RabbitMQ (notification-service'e)
   * Notification service down olsa bile tracking service çökmez.
   */
  private async publishDeliveryEvent(tracking: TrackingDocument) {
    try {
      const event: PackageDeliveredEvent = {
        barcode: tracking.barcode,
        status: 'Teslim Edildi',
        deliveredAt: tracking.deliveredAt,
      };

      // fire-and-forget; hata tracking service'i çöktürmez
      this.notificationClient.emit('package.delivered', event).subscribe({
        error: (err) =>
          this.logger.error(
            `❌ Failed to emit package.delivered event: ${err.message}`,
          ),
      });
      this.logger.log(
        `📤 Event emitted: package.delivered -> ${tracking.barcode}`,
      );

      // Mark event as published
      await this.trackingModel.updateOne(
        { _id: tracking._id },
        { deliveryEventPublished: true },
      );
    } catch (error) {
      this.logger.error(
        `❌ Error publishing delivery event: ${error.message}`,
      );
    }
  }

  /**
   * Start simulation for existing packages that haven't been delivered yet
   */
  private async startSimulationForExistingPackages() {
    try {
      const pendingPackages = await this.trackingModel.find({
        currentStatus: { $ne: 'Teslim Edildi' },
      });

      this.logger.log(
        `🔄 Found ${pendingPackages.length} packages to resume simulation for`,
      );

      for (const pkg of pendingPackages) {
        this.startStatusSimulation(pkg.barcode, pkg.currentStatus);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error starting simulation for existing packages: ${error.message}`,
      );
    }
  }

  /**
   * Get tracking by barcode
   */
  async getTrackingByBarcode(barcode: string): Promise<any> {
    try {
      const tracking = await this.trackingModel.findOne({ barcode });
      if (!tracking) {
        return {
          success: false,
          message: 'Tracking record not found',
        };
      }
      return {
        success: true,
        data: tracking,
      };
    } catch (error) {
      this.logger.error(`❌ Error fetching tracking: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all trackings
   */
  async getAllTrackings(): Promise<any> {
    try {
      const trackings = await this.trackingModel
        .find()
        .sort({ createdAt: -1 });
      return {
        success: true,
        count: trackings.length,
        data: trackings,
      };
    } catch (error) {
      this.logger.error(`❌ Error fetching trackings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tracking by status
   */
  async getTrackingByStatus(status: string): Promise<any> {
    try {
      const trackings = await this.trackingModel.find({
        currentStatus: status,
      });
      return {
        success: true,
        count: trackings.length,
        data: trackings,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error fetching trackings by status: ${error.message}`,
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
      service: 'tracking-service',
      activeSimulations: this.simulationIntervals.size,
      timestamp: new Date(),
    };
  }
}
