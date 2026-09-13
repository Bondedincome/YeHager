import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode ?? 200;
        const safeData = this.normalizePayload(data);
        const message = this.resolveMessage(safeData, statusCode);

        return {
          success: true,
          statusCode,
          message,
          data: safeData.data,
          timestamp: new Date().toISOString(),
        } as SuccessResponse<T>;
      }),
    );
  }

  private normalizePayload(data: unknown): { data: unknown; message?: string } {
    if (
      data !== null &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      ('data' in data || 'message' in data)
    ) {
      const payload = data as { data?: unknown; message?: string };
      return {
        data: payload.data ?? data,
        message: payload.message,
      };
    }

    return { data };
  }

  private resolveMessage(
    payload: { data: unknown; message?: string },
    statusCode: number,
  ): string {
    if (
      payload.message &&
      typeof payload.message === 'string' &&
      payload.message.trim().length > 0
    ) {
      return payload.message;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return 'Success';
    }

    return 'Request completed';
  }
}
