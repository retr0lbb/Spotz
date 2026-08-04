import z from "zod";

export const getSpotImagesQuerySchema = z.object({
    limit: z.coerce.number().positive().int().default(10),
    order: z.union([z.literal("asc"), z.literal("desc")]).optional(),
    ownerId: z.uuid().optional(),
    cursor: z.string().optional()
})


export type GetSpotImagesQueryDTO = z.infer<typeof getSpotImagesQuerySchema>