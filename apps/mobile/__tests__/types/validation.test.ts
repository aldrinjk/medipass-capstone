import {
  loginSchema,
  registerSchema,
  demographicsSchema,
  allergySchema,
  emergencyContactSchema,
  createPassSchema,
} from '../../types/validation';

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
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password1234',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password1234',
        confirmPassword: 'password1234',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('demographicsSchema', () => {
    it('validates ISO date format YYYY-MM-DD', () => {
      const valid = demographicsSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1990-05-20',
      });
      expect(valid.success).toBe(true);

      const invalid = demographicsSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '20-05-1990',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('allergySchema', () => {
    it('requires substance and valid severity', () => {
      const valid = allergySchema.safeParse({
        substance: 'Penicillin',
        severity: 'SEVERE',
        reaction: 'Anaphylaxis',
      });
      expect(valid.success).toBe(true);

      const invalid = allergySchema.safeParse({
        substance: '',
        severity: 'UNKNOWN_SEVERITY',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('emergencyContactSchema', () => {
    it('requires name, relationship, and phone number', () => {
      const valid = emergencyContactSchema.safeParse({
        name: 'John Doe',
        relationship: 'Spouse',
        phoneNumber: '+1-555-123-4567',
      });
      expect(valid.success).toBe(true);

      const invalid = emergencyContactSchema.safeParse({
        name: '',
        relationship: '',
        phoneNumber: '',
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
});
