import z from 'zod/v4';

export const registerSchema = z.object({
  username: z.string().nonempty(),
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
