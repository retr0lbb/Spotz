import z from "zod";

export const getAllSpotsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    select: z.coerce.number().int().positive().default(10).optional(),
    lat: z.string().optional(),
    lon: z.string().optional(),
    radius: z.coerce.number().int().positive().default(500)
})

export type GetAllSpotsQuery = z.infer<typeof getAllSpotsQuerySchema>