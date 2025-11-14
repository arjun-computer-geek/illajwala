import { connect, NatsConnection, JSONCodec, Subscription } from 'nats';
import { createLogger } from '@illajwala/shared';
import { eventBusConfig } from './config';
import type { Event, EventType } from './events';
import { getEventSubject } from './events';

const jsonCodec = JSONCodec<Event>();

export interface EventHandler<T extends Event = Event> {
  (event: T): Promise<void> | void;
}

export interface EventSubscriberOptions {
  url?: string;
  queueGroup?: string;
  maxReconnectAttempts?: number;
  reconnectTimeWait?: number;
}

export class EventSubscriber {
  private connection: NatsConnection | null = null;
  private logger: ReturnType<typeof createLogger>;
  private config: EventSubscriberOptions;
  private subscriptions: Map<string, Subscription> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();

  constructor(options: EventSubscriberOptions = {}) {
    this.config = {
      url: options.url || eventBusConfig.url,
      queueGroup: options.queueGroup,
      maxReconnectAttempts: options.maxReconnectAttempts || eventBusConfig.maxReconnectAttempts,
      reconnectTimeWait: options.reconnectTimeWait || eventBusConfig.reconnectTimeWait,
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
        maxReconnectAttempts: this.config.maxReconnectAttempts,
        reconnectTimeWait: this.config.reconnectTimeWait,
      });

      this.logger.info('Connected to NATS event bus', {
        url: this.config.url,
      });

      // Handle connection errors
      this.connection.closed().then((error) => {
        if (error) {
          this.logger.error('NATS connection closed with error', error);
        } else {
          this.logger.info('NATS connection closed');
        }
        this.connection = null;
      });

      // Resubscribe to all subscriptions
      for (const [subject, handlers] of this.handlers.entries()) {
        await this.subscribeInternal(subject, handlers);
      }
    } catch (error) {
      this.logger.error('Failed to connect to NATS event bus', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Unsubscribe from all subscriptions
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();

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

  private async subscribeInternal(
    subject: string,
    handlers: EventHandler[],
  ): Promise<Subscription> {
    await this.ensureConnected();

    if (!this.connection) {
      throw new Error('Not connected to NATS event bus');
    }

    const subscription = this.config.queueGroup
      ? this.connection.subscribe(subject, { queue: this.config.queueGroup })
      : this.connection.subscribe(subject);

    // Process messages
    (async () => {
      for await (const msg of subscription) {
        try {
          const event = jsonCodec.decode(msg.data) as Event;

          // Call all handlers
          for (const handler of handlers) {
            try {
              await handler(event);
              this.logger.debug('Event handler executed', {
                type: event.type,
                subject,
                tenantId: event.tenantId,
              });
            } catch (error) {
              this.logger.error('Event handler failed', error as Error, {
                type: event.type,
                subject,
                tenantId: event.tenantId,
              });
              // Continue processing other handlers even if one fails
            }
          }

          // Note: Core NATS doesn't support acknowledgment
          // Messages are fire-and-forget. If acknowledgment is needed, use JetStream.
        } catch (error) {
          this.logger.error('Failed to process event', error as Error, {
            subject,
            error: error instanceof Error ? error.message : String(error),
          });
          // In core NATS, there's no acknowledgment, so we just log the error
          // The message is lost if processing fails. For guaranteed delivery, use JetStream.
        }
      }
    })().catch((error) => {
      this.logger.error('Subscription error', error);
    });

    return subscription;
  }

  async subscribe<T extends Event = Event>(
    eventType: EventType,
    handler: EventHandler<T>,
  ): Promise<void> {
    const subject = getEventSubject(eventType);

    // Add handler to map
    if (!this.handlers.has(subject)) {
      this.handlers.set(subject, []);
    }
    this.handlers.get(subject)!.push(handler as EventHandler);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(subject)) {
      const handlers = this.handlers.get(subject)!;
      const subscription = await this.subscribeInternal(subject, handlers);
      this.subscriptions.set(subject, subscription);
      this.logger.info('Subscribed to event', {
        type: eventType,
        subject,
        queueGroup: this.config.queueGroup,
      });
    }
  }

  async unsubscribe(eventType: EventType): Promise<void> {
    const subject = getEventSubject(eventType);

    const subscription = this.subscriptions.get(subject);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subject);
      this.handlers.delete(subject);
      this.logger.info('Unsubscribed from event', {
        type: eventType,
        subject,
      });
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const [subject, subscription] of this.subscriptions.entries()) {
      subscription.unsubscribe();
      this.subscriptions.delete(subject);
      this.handlers.delete(subject);
    }
    this.logger.info('Unsubscribed from all events');
  }
}

export function createEventSubscriber(options?: EventSubscriberOptions): EventSubscriber {
  return new EventSubscriber(options);
}
