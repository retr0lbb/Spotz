import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod/v4';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json(res);
      return;
    }

    if (exception instanceof ZodError) {
      const errors = exception.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      response.status(HttpStatus.BAD_REQUEST).json({
        message: 'Validation failed',
        statusCode: 400,
        errors,
      });
      return;
    }

    console.error('Unhandled exception:', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      statusCode: 500,
    });
  }
}
