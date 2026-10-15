import * as z from 'zod';

export const ContactEmailSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().email(),
  message: z.string().trim().min(10).max(5000),
});
