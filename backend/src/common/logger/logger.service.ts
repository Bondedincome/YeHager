import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  logHttp(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    ip: string,
  ): void {
    const message = `${method} ${url} ${statusCode} ${durationMs}ms ${ip}`;
    this.log(message, 'HTTP');
  }

  logException(message: string, stack?: string): void {
    this.error(message, stack, 'EXCEPTION');
  }
}
