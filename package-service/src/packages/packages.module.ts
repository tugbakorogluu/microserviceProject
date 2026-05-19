import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { Package, PackageSchema } from './packages.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Package.name,
        schema: PackageSchema,
      },
    ]),
    // registerAsync kullanıldı — env değerleri ConfigModule yüklendikten sonra okunuyor.
    // register() ile template literal modül dosyası import edildiğinde değerlendiriliyor
    // ve ConfigModule henüz çalışmadığından process.env değerler undefined oluyor.
    ClientsModule.registerAsync([
      {
        name: 'TRACKING_CLIENT',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`,
            ],
            queue: 'tracking.service.queue',
            queueOptions: {
              durable: true,
              // Consumer (tracking-service main.ts) aynı kuyruğu x-max-priority:10 ile
              // declare ediyor. Producer da eşleşmeli, yoksa PRECONDITION_FAILED hatası alınır.
              arguments: { 'x-max-priority': 10 },
            },
          },
        }),
      },
    ]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
