import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emergencyContactSchema, EmergencyContactFormData } from '../../types/validation';
import { EmergencyContact } from '../../types/emergencyContact';
import { Input, Button, Card } from '../../components';

interface EmergencyContactFormProps {
  initialData?: EmergencyContact | null;
  onSubmit: (data: EmergencyContactFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

export const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: initialData?.name || '',
      relationship: initialData?.relationship || '',
      phoneNumber: initialData?.phoneNumber || '',
      alternatePhone: initialData?.alternatePhone || '',
      email: initialData?.email || '',
    },
  });

  return (
    <Card>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contact Full Name *"
              placeholder="e.g. Jane Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="relationship"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Relationship *"
              placeholder="e.g. Spouse, Parent, Sibling, Friend"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.relationship?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Primary Phone Number *"
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.phoneNumber?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="alternatePhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Alternate Phone Number"
              placeholder="+1 (555) 987-6543"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.alternatePhone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="emergency.contact@example.org"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          title="Save Emergency Contact"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  submitBtn: {
    marginTop: 12,
  },
});
