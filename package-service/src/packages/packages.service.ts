import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Package, PackageDocument } from './packages.schema';
import { CreatePackageDto, PackageCreatedEvent } from './packages.dto';

@Injectable()
export class PackagesService implements OnModuleInit {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    @Inject('TRACKING_CLIENT') private trackingClient: ClientProxy,
  ) {}

  /**
   * Initialize: RabbitMQ bağlantısını başlat
   * Bağlantı hatası bu servisi çöktürmez.
   */
  async onModuleInit() {
    try {
      await this.trackingClient.connect();
      this.logger.log('✅ TRACKING_CLIENT connected to RabbitMQ');
    } catch (error) {
      // Bağlantı başarısız olsa bile servis ayakta kalır.
      // Emit sırasında retry mekanizması devreye girer.
      this.logger.warn(
        `⚠️ Initial RabbitMQ connection failed, will retry on emit: ${error.message}`,
      );
    }
  }

  /**
   * Create a new package with unique barcode
   * Publishes package.created event to RabbitMQ (tracking-service'e)
   */
  async createPackage(createPackageDto: CreatePackageDto): Promise<any> {
    try {
      // Generate unique barcode
      const barcode = this.generateBarcode();

      // Create package in database
      const newPackage = new this.packageModel({
        barcode,
        sender: createPackageDto.sender,
        receiver: createPackageDto.receiver,
        status: 'Hazırlanıyor',
        createdAt: new Date(),
      });

      const savedPackage = await newPackage.save();
      this.logger.log(`✅ Package created: ${barcode}`);

      // Publish event to RabbitMQ (fire-and-forget, tracking-service dinliyor)
      const event: PackageCreatedEvent = {
        barcode: savedPackage.barcode,
        sender: savedPackage.sender,
        receiver: savedPackage.receiver,
        status: savedPackage.status,
        createdAt: savedPackage.createdAt,
      };

      // emit() fire-and-forget'tir; observable subscribe edilerek hata yakalanır.
      // Tracking service down olsa bile package service çökmez.
      this.trackingClient.emit('package.created', event).subscribe({
        error: (err) =>
          this.logger.error(
            `❌ Failed to emit package.created event: ${err.message}`,
          ),
      });
      this.logger.log(`📤 Event emitted: package.created -> ${barcode}`);

      return {
        success: true,
        barcode: savedPackage.barcode,
        message: 'Package created successfully',
        data: savedPackage,
      };
    } catch (error) {
      this.logger.error(`❌ Error creating package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get package by barcode
   */
  async getPackageByBarcode(barcode: string): Promise<any> {
    try {
      const pkg = await this.packageModel.findOne({ barcode });
      if (!pkg) {
        return {
          success: false,
          message: 'Package not found',
        };
      }
      return {
        success: true,
        data: pkg,
      };
    } catch (error) {
      this.logger.error(`❌ Error fetching package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all packages
   */
  async getAllPackages(): Promise<any> {
    try {
      const packages = await this.packageModel.find().sort({ createdAt: -1 });
      return {
        success: true,
        count: packages.length,
        data: packages,
      };
    } catch (error) {
      this.logger.error(`❌ Error fetching packages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate unique barcode (10-digit or UUID)
   */
  private generateBarcode(): string {
    // Using UUID for guaranteed uniqueness
    return `PKG-${uuidv4().substring(0, 12).toUpperCase()}`;
  }

  /**
   * Health check message pattern
   */
  @MessagePattern('package.health')
  handleHealthCheck() {
    return {
      status: 'healthy',
      service: 'package-service',
      timestamp: new Date(),
    };
  }
}
