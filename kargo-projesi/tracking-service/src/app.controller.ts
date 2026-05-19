import { Controller, Get, Post, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { TrackingService } from './tracking/tracking.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly trackingService: TrackingService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('advance/:id')
  advancePackage(@Param('id') id: string) {
    return this.trackingService.advancePackage(id);
  }
}
