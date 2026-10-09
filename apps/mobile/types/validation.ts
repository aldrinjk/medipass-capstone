import { z } from 'zod';
import { ALL_SHARE_CATEGORIES, ShareCategory } from './sharing';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address').max(320),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const demographicsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  gender: z.string().max(40).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
});

export type DemographicsFormData = z.infer<typeof demographicsSchema>;

export const allergySchema = z.object({
  substance: z.string().min(1, 'Substance is required').max(120),
  reaction: z.string().max(200).optional().or(z.literal('')),
  severity: z.string().max(40).optional().or(z.literal('')),
});

export type AllergyFormData = z.infer<typeof allergySchema>;

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(120),
  dosage: z.string().max(120).optional().or(z.literal('')),
  frequency: z.string().max(120).optional().or(z.literal('')),
});

export type MedicationFormData = z.infer<typeof medicationSchema>;

export const conditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required').max(120),
  status: z.string().max(60).optional().or(z.literal('')),
  notes: z.string().max(300).optional().or(z.literal('')),
});

export type ConditionFormData = z.infer<typeof conditionSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').max(120),
  relationship: z.string().min(1, 'Relationship is required').max(80),
  phone: z.string().min(1, 'Phone is required').max(30),
});

export type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

export const sharingPreferencesSchema = z.object({
  categories: z.array(z.enum(ALL_SHARE_CATEGORIES as [ShareCategory, ...ShareCategory[]])),
});

export type SharingPreferencesFormData = z.infer<typeof sharingPreferencesSchema>;

export const createPassSchema = z.object({
  categories: z
    .array(z.enum(ALL_SHARE_CATEGORIES as [ShareCategory, ...ShareCategory[]]))
    .min(1, 'Select at least one category to share'),
  expiresInHours: z.number().min(1).max(168),
});

export type CreatePassFormData = z.infer<typeof createPassSchema>;
