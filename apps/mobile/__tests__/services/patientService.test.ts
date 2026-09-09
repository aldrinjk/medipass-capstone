import { patientService } from '../../services/patientService';
import { PatientProfile } from '../../types/patient';

describe('patientService Completeness Calculation', () => {
  const completeProfile: PatientProfile = {
    id: 'pat-1',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'FEMALE',
    bloodType: 'O+',
  };

  it('calculates 100% when all profile categories are provided', () => {
    const completeness = patientService.calculateCompleteness(
      completeProfile,
      2, // allergies
      3, // medications
      1, // conditions
      true // emergency contact
    );

    expect(completeness.overallPercentage).toBe(100);
    expect(completeness.demographics).toBe(true);
    expect(completeness.allergies).toBe(true);
    expect(completeness.medications).toBe(true);
    expect(completeness.conditions).toBe(true);
    expect(completeness.emergencyContact).toBe(true);
  });

  it('calculates partial percentage when some categories are missing', () => {
    const completeness = patientService.calculateCompleteness(
      completeProfile,
      0, // no allergies
      0, // no medications
      0, // no conditions
      false // no emergency contact
    );

    expect(completeness.demographics).toBe(true);
    expect(completeness.overallPercentage).toBe(25);
    expect(completeness.emergencyContact).toBe(false);
  });
});
