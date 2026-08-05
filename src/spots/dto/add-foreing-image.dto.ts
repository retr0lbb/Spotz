import z from 'zod/v4';

export const addForeignImageParamsSchema = z.object({
  id: z.uuid(),
});

export type AddForeignImageParamsDTO = z.infer<
  typeof addForeignImageParamsSchema
>;
