import { z } from 'zod';

export const ticketIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.number().int().positive().nullable().default(null),
  slaHours: z.number().int().positive().default(8),
});

export const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assigneeId: z.preprocess(
    (val) => {
      if (val === 'null') return null;
      if (val === '') return undefined;
      return val;
    },
    z.coerce.number().int().positive().nullable()
  ).optional(),
  assigneeName: z.string().optional(),
});
