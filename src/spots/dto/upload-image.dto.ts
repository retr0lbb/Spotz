import z from "zod";

export const uploadSpotImageDTOSchema = z.object({
    mimeType: z.string(),
    sizeBytes: z.number().max(15 * 8 * 1024 * 1024),
    originalName: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
})

export type UploadSpotImageDTO = z.infer<typeof uploadSpotImageDTOSchema>