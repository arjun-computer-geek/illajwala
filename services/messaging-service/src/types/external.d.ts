declare module "bullmq" {
  export class Queue<T = any> {
    constructor(name: string, options?: { connection?: unknown });
    name: string;
    add(name: string, data: T, opts?: Record<string, unknown>): Promise<unknown>;
  }

  export class Worker<T = any> {
    constructor(
      queueName: string,
      processor: (job: { id: string; data: T }) => Promise<void> | void,
      options?: { connection?: unknown; concurrency?: number }
    );
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
}

declare module "ioredis" {
  class IORedis {
    constructor(url: string);
  }
  export = IORedis;
}

declare module "pino" {
  interface Logger {
    info(obj: Record<string, unknown>, msg?: string): void;
    info(msg: string): void;
    debug(obj: Record<string, unknown>, msg?: string): void;
    error(obj: Record<string, unknown>, msg?: string): void;
    warn(obj: Record<string, unknown>, msg?: string): void;
  }
  interface Options {
    name?: string;
    transport?: { target: string };
  }
  function pino(options?: Options): Logger;
  export default pino;
  export { Logger, Options };
}


