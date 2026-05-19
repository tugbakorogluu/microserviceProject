import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  await app.listen(3002);
  console.log(`Tracking Service is running on: ${await app.getUrl()}`);
}
bootstrap();
