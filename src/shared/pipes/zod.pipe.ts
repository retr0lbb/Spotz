import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodType, infer as zInfer } from 'zod';

export class ZodValidationPipe<
  T extends ZodType<any>,
> implements PipeTransform {
  constructor(private schema: T) {}

  transform(value: unknown, metadata?: ArgumentMetadata): zInfer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.flatten();

      throw new BadRequestException({
        message: 'Validation Failed',
        errors: errors.fieldErrors,
      });
    }

    return result.data;
  }
}
