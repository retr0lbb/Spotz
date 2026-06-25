import z from 'zod/v4';

export const updateSpotSchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
  alias: z.string().nonempty().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nonempty().optional(),
});

export const updateSpotParamsSchema = z.object({
  id: z.uuid(),
});

export type UpdateSpotDTO = z.infer<typeof updateSpotSchema>;

export type UpdateSpotParamsDTO = z.infer<typeof updateSpotParamsSchema>;
