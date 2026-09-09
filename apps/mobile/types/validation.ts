import { z } from 'zod';
import { ALL_SHARE_CATEGORIES, ShareCategory } from './sharing';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const demographicsSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const).optional(),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'] as const)
    .optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

export type DemographicsFormData = z.infer<typeof demographicsSchema>;

export const allergySchema = z.object({
  substance: z.string().min(1, 'Allergen / substance is required').max(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE'] as const),
  reaction: z.string().max(200).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESOLVED'] as const).optional(),
});

export type AllergyFormData = z.infer<typeof allergySchema>;

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required').max(100),
  dosage: z.string().max(50).optional().or(z.literal('')),
  frequency: z.string().max(50).optional().or(z.literal('')),
  route: z.string().max(50).optional().or(z.literal('')),
  instructions: z.string().max(200).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED'] as const).optional(),
});

export type MedicationFormData = z.infer<typeof medicationSchema>;

export const conditionSchema = z.object({
  conditionName: z.string().min(1, 'Condition name is required').max(100),
  clinicalStatus: z.enum([
    'ACTIVE',
    'RECURRENCE',
    'RELAPSE',
    'INACTIVE',
    'REMISSION',
    'RESOLVED',
  ] as const),
  onsetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Onset date must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(300).optional().or(z.literal('')),
});

export type ConditionFormData = z.infer<typeof conditionSchema>;

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(100),
  relationship: z.string().min(1, 'Relationship is required').max(50),
  phoneNumber: z
    .string()
    .min(5, 'Valid phone number is required')
    .max(20, 'Phone number is too long'),
  alternatePhone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
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
  expiresInHours: z.number().min(1).max(168), // 1 hour to 7 days
});

export type CreatePassFormData = z.infer<typeof createPassSchema>;
