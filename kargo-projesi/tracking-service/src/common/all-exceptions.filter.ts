import { Injectable, Logger, Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = (exception as any).getStatus?.() || 500;
    const message =
      (exception as any).message || 'Internal server error';

    this.logger.error(
      `Error: ${message} | Status: ${status} | Path: ${request.path}`,
      (exception as Error).stack,
    );

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.path,
    });
  }
}
