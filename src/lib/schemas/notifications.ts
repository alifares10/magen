import { z } from "zod";

const notificationSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const alertNotificationRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().nullable(),
  severity: notificationSeveritySchema,
  status: z.string().min(1),
  location_name: z.string().min(1).nullable().optional(),
  city: z.string().min(1).nullable().optional(),
  region: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
  published_at: isoDateTimeSchema,
});

export const officialNotificationRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  severity: notificationSeveritySchema.nullable(),
  is_active: z.boolean(),
  published_at: isoDateTimeSchema,
});

const notificationTypeSchema = z.enum(["official_alert", "official_guidance"]);

export const inAppNotificationSchema = z.object({
  id: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  location: z.string().min(1).nullable(),
  severity: notificationSeveritySchema.nullable(),
  publishedAt: isoDateTimeSchema,
  createdAt: z.number().int().nonnegative(),
});

export type AlertNotificationRow = z.infer<typeof alertNotificationRowSchema>;
export type OfficialNotificationRow = z.infer<typeof officialNotificationRowSchema>;
export type InAppNotification = z.infer<typeof inAppNotificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
