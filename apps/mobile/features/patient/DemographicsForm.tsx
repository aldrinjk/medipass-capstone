import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { demographicsSchema, DemographicsFormData } from '../../types/validation';
import { PatientProfile } from '../../types/patient';
import { Input, Button, Card } from '../../components';

interface DemographicsFormProps {
  initialData?: PatientProfile | null;
  onSubmit: (data: DemographicsFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemographicsFormData>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      birthDate: initialData?.birthDate || '',
      gender: initialData?.gender || '',
      phone: initialData?.phone || '',
    },
  });

  useEffect(() => {
    reset({
      fullName: initialData?.fullName || '',
      birthDate: initialData?.birthDate || '',
      gender: initialData?.gender || '',
      phone: initialData?.phone || '',
    });
  }, [initialData, reset]);

  return (
    <Card>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full Name *"
              placeholder="e.g. Jane Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Birth Date (YYYY-MM-DD)"
              placeholder="1990-01-15"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.birthDate?.message}
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
