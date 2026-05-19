import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Port 3001 for package-service
  await app.listen(3001);
  console.log(`Package Service is running on: ${await app.getUrl()}`);
}
bootstrap();
