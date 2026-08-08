import z from 'zod/v4';

export const registerSchema = z.object({
  username: z.string().nonempty().min(4),
  email: z.email(),
  password: z.string().min(6).max(64),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
