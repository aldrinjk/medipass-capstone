import { patientService } from '../../services/patientService';
import { allergyService } from '../../services/allergyService';
import { apiClient, isMockEnabled } from '../../services/apiClient';
import { PatientProfile } from '../../types/patient';

jest.mock('../../services/apiClient', () => {
  const actual = jest.requireActual('../../services/apiClient');
  return {
    ...actual,
    isMockEnabled: jest.fn(() => false),
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedIsMockEnabled = isMockEnabled as jest.MockedFunction<typeof isMockEnabled>;

describe('patient and clinical DTO contracts', () => {
  beforeEach(() => {
    mockedIsMockEnabled.mockReturnValue(false);
    mockedClient.get.mockReset();
  });

  it('calculates completeness from backend demographic fields', () => {
    const completeProfile: PatientProfile = {
      id: 'pat-1',
      fullName: 'Jane Doe',
      birthDate: '1990-01-01',
      gender: 'FEMALE',
      phone: '+1-555-0000',
    };

    const completeness = patientService.calculateCompleteness(
      completeProfile,
      2,
      3,
      1,
      true
    );

    expect(completeness.overallPercentage).toBe(100);
    expect(completeness.demographics).toBe(true);
  });

  it('does not require blood type for a complete demographic record', () => {
    const profile: PatientProfile = {
      id: 'pat-1',
      fullName: 'Jane Doe',
      birthDate: '1990-01-01',
      gender: 'FEMALE',
      phone: '+1-555-0000',
    };

    expect(patientService.calculateCompleteness(profile, 0, 0, 0, false).demographics).toBe(
      true
    );
  });

  it('propagates API failures instead of returning silent mock profile data', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('network failure'));
    await expect(patientService.getProfile()).rejects.toThrow('network failure');
  });

  it('propagates API failures instead of returning silent mock allergies', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('network failure'));
    await expect(allergyService.getAllergies()).rejects.toThrow('network failure');
  });
});
