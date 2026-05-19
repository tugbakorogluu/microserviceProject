import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Enable RabbitMQ Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://rabbitmq:5672'],
      queue: 'package_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();
  // Port 3001 for package-service HTTP
  await app.listen(3001);
  console.log(`Package Service is running on: ${await app.getUrl()}`);
}
bootstrap();
