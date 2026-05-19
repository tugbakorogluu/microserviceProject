import { Injectable, Logger } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  // Configuration
  private readonly failureThreshold = 5; // Number of failures to open circuit
  private readonly resetTimeout = 60000; // 60 seconds to try half-open
  private readonly successThreshold = 2; // Number of successes to close circuit

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T,
  ): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.logger.log('Circuit breaker attempting to reset (HALF_OPEN state)');
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        this.logger.warn('Circuit breaker is OPEN. Using fallback.');
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN and no fallback provided');
      }
    }

    try {
      const result = await operation();

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.reset();
          this.logger.log('Circuit breaker RESET to CLOSED');
        }
      } else {
        this.failureCount = 0; // Reset on success
      }

      return result;
    } catch (error) {
      this.recordFailure();

      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.state = CircuitBreakerState.OPEN;
        this.lastFailureTime = Date.now();
        this.logger.error('Circuit breaker OPENED due to failure in HALF_OPEN state');
      }

      if (fallback) {
        this.logger.warn('Operation failed. Using fallback.');
        return fallback();
      }

      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.logger.error(
        `Circuit breaker OPENED after ${this.failureCount} failures`,
      );
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.resetTimeout;
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}
