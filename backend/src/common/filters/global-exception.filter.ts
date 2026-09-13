import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { LoggerService } from '../logger/logger.service';

interface ErrorPayload {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode = this.resolveStatusCode(exception);
    const message = this.resolveMessage(exception);
    const path = request.originalUrl ?? request.url ?? '/';

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.loggerService.error(
        `Unhandled exception on ${request.method} ${path}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const payload: ErrorPayload = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path,
    };

    response.status(statusCode).json(payload);
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof EntityNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }

    if (exception instanceof QueryFailedError) {
      return HttpStatus.BAD_GATEWAY;
    }

    if (exception instanceof Error && exception.name === 'ValidationError') {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (typeof response === 'object' && response !== null) {
        const messages = (response as { message?: string | string[] }).message;

        if (Array.isArray(messages)) {
          return messages[0];
        }

        if (typeof messages === 'string') {
          return messages;
        }
      }

      return exception.message;
    }

    if (exception instanceof EntityNotFoundError) {
      return 'Resource not found';
    }

    if (exception instanceof QueryFailedError) {
      return 'Database query failed';
    }

    if (exception instanceof Error && exception.name === 'ValidationError') {
      return 'Validation failed';
    }

    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    return nodeEnv === 'production'
      ? 'Internal server error'
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';
  }
}
