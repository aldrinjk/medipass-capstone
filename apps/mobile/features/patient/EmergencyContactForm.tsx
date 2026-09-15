import React, { useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
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
    reset,
    formState: { errors },
  } = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: initialData?.name || '',
      relationship: initialData?.relationship || '',
      phone: initialData?.phone || '',
    },
  });

  useEffect(() => {
    reset({
      name: initialData?.name || '',
      relationship: initialData?.relationship || '',
      phone: initialData?.phone || '',
    });
  }, [initialData, reset]);

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
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number *"
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
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
