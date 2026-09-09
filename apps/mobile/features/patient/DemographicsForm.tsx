import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { demographicsSchema, DemographicsFormData } from '../../types/validation';
import { PatientProfile, Gender, BloodType } from '../../types/patient';
import { Input, Button, Card } from '../../components';

interface DemographicsFormProps {
  initialData?: PatientProfile | null;
  onSubmit: (data: DemographicsFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DemographicsFormData>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      gender: initialData?.gender || 'UNKNOWN',
      bloodType: initialData?.bloodType || 'UNKNOWN',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
    },
  });

  return (
    <Card>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="First Name *"
              placeholder="e.g. Jane"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.firstName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Last Name *"
              placeholder="e.g. Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.lastName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Date of Birth (YYYY-MM-DD)"
              placeholder="1990-01-15"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.dateOfBirth?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bloodType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Blood Type</Text>
              <View style={styles.pillContainer}>
                {BLOOD_TYPES.map((bt) => (
                  <Button
                    key={bt}
                    title={bt}
                    size="sm"
                    variant={value === bt ? 'primary' : 'outline'}
                    onPress={() => onChange(bt)}
                    style={styles.pill}
                  />
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Gender</Text>
              <View style={styles.pillContainer}>
                {GENDERS.map((g) => (
                  <Button
                    key={g}
                    title={g}
                    size="sm"
                    variant={value === g ? 'primary' : 'outline'}
                    onPress={() => onChange(g)}
                    style={styles.pill}
                  />
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Residential Address"
              placeholder="Street, City, State, ZIP"
              multiline
              numberOfLines={3}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.address?.message}
            />
          )}
        />

        <Button
          title="Save Demographics"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  pickerSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  submitButton: {
    marginTop: 12,
  },
});
