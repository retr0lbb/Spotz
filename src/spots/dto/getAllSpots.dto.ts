import z from 'zod';

export const getAllSpotsQuerySchema = z.object({
  lat: z.string().optional(),
  lon: z.string().optional(),
  radius: z.coerce.number().int().positive().default(500),
  limit: z.coerce.number().positive().int().default(10),
  cursor: z.string().optional(),
});

export type GetAllSpotsQuery = z.infer<typeof getAllSpotsQuerySchema>;
