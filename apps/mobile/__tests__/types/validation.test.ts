import {
  loginSchema,
  registerSchema,
  demographicsSchema,
  allergySchema,
  medicationSchema,
  conditionSchema,
  emergencyContactSchema,
  createPassSchema,
} from '../../types/validation';
import { SHARE_CATEGORY_LABELS } from '../../types/sharing';

describe('Zod Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({
        email: 'patient@example.com',
        password: 'securepassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid emails', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short passwords', () => {
      const result = loginSchema.safeParse({
        email: 'patient@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'jane@example.com',
        password: 'password1234',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
    });

    it('accepts email and password only', () => {
      const result = registerSchema.safeParse({
        email: 'jane@example.com',
        password: 'password1234',
        confirmPassword: 'password1234',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('demographicsSchema', () => {
    it('validates ISO birth date format YYYY-MM-DD', () => {
      const valid = demographicsSchema.safeParse({
        fullName: 'Jane Doe',
        birthDate: '1990-05-20',
      });
      expect(valid.success).toBe(true);

      const invalid = demographicsSchema.safeParse({
        fullName: 'Jane Doe',
        birthDate: '20-05-1990',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('allergySchema', () => {
    it('requires substance', () => {
      const valid = allergySchema.safeParse({
        substance: 'Penicillin',
        severity: 'SEVERE',
        reaction: 'Anaphylaxis',
      });
      expect(valid.success).toBe(true);

      const invalid = allergySchema.safeParse({
        substance: '',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('medicationSchema', () => {
    it('requires name and omits route/instructions/status', () => {
      const valid = medicationSchema.safeParse({
        name: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).not.toHaveProperty('route');
        expect(valid.data).not.toHaveProperty('instructions');
        expect(valid.data).not.toHaveProperty('status');
      }
    });
  });

  describe('conditionSchema', () => {
    it('uses name, status, and notes', () => {
      const valid = conditionSchema.safeParse({
        name: 'Asthma',
        status: 'ACTIVE',
        notes: 'Cold-air trigger',
      });
      expect(valid.success).toBe(true);
    });
  });

  describe('emergencyContactSchema', () => {
    it('requires name, relationship, and phone', () => {
      const valid = emergencyContactSchema.safeParse({
        name: 'John Doe',
        relationship: 'Spouse',
        phone: '+1-555-123-4567',
      });
      expect(valid.success).toBe(true);

      const invalid = emergencyContactSchema.safeParse({
        name: '',
        relationship: '',
        phone: '',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('createPassSchema', () => {
    it('requires at least one share category', () => {
      const valid = createPassSchema.safeParse({
        categories: ['DEMOGRAPHICS', 'ALLERGIES'],
        expiresInHours: 24,
      });
      expect(valid.success).toBe(true);

      const invalid = createPassSchema.safeParse({
        categories: [],
        expiresInHours: 24,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('sharing copy', () => {
    it('does not advertise unsupported backend fields', () => {
      const copy = Object.values(SHARE_CATEGORY_LABELS)
        .map((item) => item.description.toLowerCase())
        .join(' ');
      expect(copy).not.toMatch(/blood type/);
      expect(copy).not.toMatch(/administration instructions/);
      expect(copy).not.toMatch(/onset/);
    });
  });
});
