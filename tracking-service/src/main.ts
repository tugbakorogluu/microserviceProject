import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — dashboard ve dış istemcilerin erişimine izin ver
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup RabbitMQ Microservice (bu servis kendi kuyruğunu consumer olarak dinler)
  const rmqOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [
        `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
      ],
      queue: 'tracking.service.queue',
      queueOptions: {
        durable: true,
        arguments: {
          'x-max-priority': 10,
        },
      },
      prefetch: 1,
      noAck: false,
      socketOptions: {
        heartbeat: 60,
        // Bağlantı koptuğunda yeniden bağlanmak için
        reconnectTimeInSeconds: 5,
      },
    },
  };

  // Connect Microservice
  app.connectMicroservice(rmqOptions);

  // Önce microservice bağlantısını başlat (RabbitMQ consumer)
  try {
    await app.startAllMicroservices();
    console.log('✅ Tracking Service RabbitMQ microservice connected');
  } catch (err) {
    // RabbitMQ hazır değilse HTTP sunucusu yine de ayakta kalır
    console.warn(
      `⚠️ Tracking Service RabbitMQ connection failed, HTTP server will still run: ${err.message}`,
    );
  }

  // HTTP sunucusunu başlat
  const httpPort = process.env.PORT || 3002;
  await app.listen(httpPort);
  console.log(`✅ Tracking Service HTTP server running on port ${httpPort}`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap error:', err);
  process.exit(1);
});
