import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Tracking, TrackingSchema } from './tracking.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      {
        name: Tracking.name,
        schema: TrackingSchema,
      },
    ]),
    // registerAsync kullanıldı — env değerleri ConfigModule yüklendikten sonra okunuyor.
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_CLIENT',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`,
            ],
            queue: 'notification.service.queue',
            queueOptions: {
              durable: true,
              // Consumer (notification-service main.ts) aynı kuyruğu x-max-priority:10 ile
              // declare ediyor. Producer da eşleşmeli, yoksa PRECONDITION_FAILED hatası alınır.
              arguments: { 'x-max-priority': 10 },
            },
          },
        }),
      },
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
