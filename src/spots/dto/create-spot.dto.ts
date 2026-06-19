import z from 'zod/v4';

export const createSpotSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  alias: z.string().nonempty(),
  description: z.string().nullable().optional(),
  address: z.string().nonempty(),
  photos: z
    .array(
      z.object({
        mime_type: z.literal('png'),
        bytes: z.number().positive().int(),
        key: z.string().nonempty(),
      }),
    )
    .nullable(),
});

export interface CreateSpotDTO extends z.infer<typeof createSpotSchema> {}
