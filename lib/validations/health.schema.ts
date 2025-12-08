import { z } from 'zod';

export const heartrateSchema = z.object({
  caregiverId: z.number().int().positive(),
  bpm: z.number().int().min(30).max(200),
});

export const temperatureSchema = z.object({
  caregiverId: z.number().int().positive(),
  value: z.number().min(30).max(45),
});

export const fallSchema = z.object({
  caregiverId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  xAxis: z.number(),
  yAxis: z.number(),
  zAxis: z.number(),
});

export type HeartrateInput = z.infer<typeof heartrateSchema>;
export type TemperatureInput = z.infer<typeof temperatureSchema>;
export type FallInput = z.infer<typeof fallSchema>;