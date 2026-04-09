import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import { z } from 'zod';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const cityNameSchema = z.string().trim().min(1, 'city is required');

export const dateStringSchema = z.string()
  .regex(DATE_PATTERN, 'date must be in YYYY-MM-DD format')
  .refine((value) => {
    const parsed = parseISO(value);
    return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
  }, 'date must be a real calendar date');

export const forecastDateSchema = dateStringSchema.superRefine((value, ctx) => {
  const parsed = startOfDay(parseISO(value));
  const today = startOfDay(new Date());
  const distance = differenceInCalendarDays(parsed, today);

  if (distance < 0 || distance > 6) {
    const latest = addDays(today, 6);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `date must be within the next 7 days (${format(today, 'yyyy-MM-dd')} to ${format(latest, 'yyyy-MM-dd')})`,
    });
  }
});

export const positiveIntegerDistanceSchema = z.coerce.number()
  .int('maxDistance must be an integer')
  .min(1, 'maxDistance must be greater than 0')
  .max(1000, 'maxDistance must be less than or equal to 1000');

export const weatherQuerySchema = z.object({
  city: cityNameSchema,
  date: forecastDateSchema,
});

export const citiesQuerySchema = z.object({
  city: cityNameSchema.default('上海'),
  maxDistance: positiveIntegerDistanceSchema.default(300),
});

export function formatLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
