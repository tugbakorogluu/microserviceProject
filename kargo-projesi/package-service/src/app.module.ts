import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PackageModule } from './package/package.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb:27017/kargo_db'),
    PackageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
