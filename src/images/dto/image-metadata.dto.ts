import z from 'zod';

const maxBytes = 1024 * 1024 * 15; //15 megabytes
export const imageMetadataSchema = z.object({
  mimeType: z.string(),
  sizeBytes: z.number().max(maxBytes).nonoptional(),
  originalName: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export type ImageMetadataDTO = z.infer<typeof imageMetadataSchema>;
