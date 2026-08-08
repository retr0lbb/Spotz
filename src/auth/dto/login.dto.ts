import z from 'zod/v4';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(64),
});

export type LoginDTO = z.infer<typeof loginSchema>;
