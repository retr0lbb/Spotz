import z from 'zod/v4';

export const createSpotSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  alias: z.string().nonempty(),
  description: z.string().nullable().optional(),
  address: z.string().nonempty()
});

export interface CreateSpotDTO extends z.infer<typeof createSpotSchema> {}
