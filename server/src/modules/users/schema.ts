import { z } from 'zod';

export const PatchUserSchema = z.object({
  is_active: z.boolean().optional(),
  name: z.string().max(100).optional(),
  number: z.string().max(20).optional(),
  police_station: z.string().max(150).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export const PushTokenSchema = z.object({
  push_token: z.string().min(1),
});
