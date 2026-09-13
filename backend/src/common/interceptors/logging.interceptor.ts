import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          this.loggerService.logHttp(
            request.method,
            request.originalUrl,
            response.statusCode,
            durationMs,
            ip,
          );
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - startedAt;
          this.loggerService.logHttp(
            request.method,
            request.originalUrl,
            response.statusCode,
            durationMs,
            ip,
          );
          this.loggerService.logException(
            `Unexpected exception while processing ${request.method} ${request.originalUrl}`,
            error instanceof Error ? error.stack : undefined,
          );
        },
      }),
    );
  }
}
