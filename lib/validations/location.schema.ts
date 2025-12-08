import { z } from 'zod';

export const locationSchema = z.object({
  caregiverId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  battery: z.number().min(0).max(100),
});

export const safezoneSchema = z.object({
  caregiverId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusLv1: z.number().min(0),
  radiusLv2: z.number().min(0),
});

export type LocationInput = z.infer<typeof locationSchema>;
export type SafezoneInput = z.infer<typeof safezoneSchema>;