import { z } from 'zod';

export const CreateValidationSchema = z.object({
  assignment_id: z.string().uuid(),
  cell_id: z.string().uuid(),
  has_congestion: z.boolean(),
  congestion_severity: z.enum(['none', 'low', 'medium', 'high']).optional(),
  dominant_vehicle_type: z.string().max(50).optional(),
  vehicle_count_approx: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  photo_url: z.string().url(),
});
