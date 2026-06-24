import z from 'zod/v4';

export const createSpotSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  alias: z.string().nonempty(),
  description: z.string().nullable().optional(),
  address: z.string().nonempty()
});

export interface CreateSpotDTO extends z.infer<typeof createSpotSchema> {}
