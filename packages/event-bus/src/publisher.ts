import { connect, NatsConnection, JSONCodec } from 'nats';
import { createLogger } from '@illajwala/shared';
import { eventBusConfig } from './config';
import type { Event, EventType } from './events';
import { getEventSubject } from './events';

const jsonCodec = JSONCodec<Event>();

export interface EventPublisherOptions {
  url?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class EventPublisher {
  private connection: NatsConnection | null = null;
  private logger: ReturnType<typeof createLogger>;
  private config: EventPublisherOptions;
  private reconnectAttempts = 0;

  constructor(options: EventPublisherOptions = {}) {
    this.config = {
      url: options.url || eventBusConfig.url,
      maxRetries: options.maxRetries || eventBusConfig.maxRetries,
      retryDelay: options.retryDelay || eventBusConfig.retryDelay,
      timeout: options.timeout || eventBusConfig.publishTimeout,
    };
    this.logger = createLogger({
      isProd: process.env.NODE_ENV === 'production',
    });
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      this.connection = await connect({
        servers: this.config.url,
        maxReconnectAttempts: eventBusConfig.maxReconnectAttempts,
        reconnectTimeWait: eventBusConfig.reconnectTimeWait,
      });

      this.logger.info('Connected to NATS event bus', {
        url: this.config.url,
      });

      this.reconnectAttempts = 0;

      // Handle connection errors
      this.connection.closed().then((error) => {
        if (error) {
          this.logger.error('NATS connection closed with error', error);
        } else {
          this.logger.info('NATS connection closed');
        }
        this.connection = null;
      });
    } catch (error) {
      this.reconnectAttempts += 1;
      this.logger.error('Failed to connect to NATS event bus', error as Error, {
        attempt: this.reconnectAttempts,
        maxAttempts: eventBusConfig.maxReconnectAttempts,
      });

      if (this.reconnectAttempts >= eventBusConfig.maxReconnectAttempts) {
        throw new Error(
          `Failed to connect to NATS after ${this.reconnectAttempts} attempts: ${(error as Error).message}`,
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, eventBusConfig.reconnectTimeWait));

      // Retry connection
      return this.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.logger.info('Disconnected from NATS event bus');
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.isClosed()) {
      await this.connect();
    }
  }

  async publish(event: Event): Promise<void> {
    await this.ensureConnected();

    if (!this.connection) {
      throw new Error('Not connected to NATS event bus');
    }

    const subject = getEventSubject(event.type as EventType);
    const encoded = jsonCodec.encode(event);

    let lastError: Error | null = null;
    const maxAttempts = (this.config.maxRetries || 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.connection.publish(subject, encoded);
        await this.connection.flush();
        this.logger.debug('Published event', {
          type: event.type,
          subject,
          tenantId: 'tenantId' in event ? event.tenantId : undefined,
        });
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delayMs = (this.config.retryDelay || 1000) * Math.pow(2, attempt - 1);
          this.logger.warn('Failed to publish event, retrying', {
            type: event.type,
            subject,
            attempt,
            maxAttempts,
            delayMs,
            error: lastError.message,
          });

          await new Promise((resolve) => setTimeout(resolve, delayMs));

          // Reconnect if connection is lost
          if (this.connection?.isClosed()) {
            await this.connect();
          }
        }
      }
    }

    this.logger.error('Failed to publish event after all retries', lastError!, {
      type: event.type,
      subject,
      attempts: maxAttempts,
    });

    throw new Error(
      `Failed to publish event ${event.type} after ${maxAttempts} attempts: ${lastError?.message}`,
    );
  }

  async publishMany(events: Event[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}

export function createEventPublisher(options?: EventPublisherOptions): EventPublisher {
  return new EventPublisher(options);
}
