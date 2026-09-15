import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicationSchema, MedicationFormData } from '../../types/validation';
import { Medication } from '../../types/clinical';
import { Input, Button } from '../../components';

interface MedicationFormModalProps {
  isVisible: boolean;
  medication?: Medication | null;
  onClose: () => void;
  onSubmit: (data: MedicationFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

export const MedicationFormModal: React.FC<MedicationFormModalProps> = ({
  isVisible,
  medication,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      frequency: '',
    },
  });

  useEffect(() => {
    if (medication) {
      reset({
        name: medication.name,
        dosage: medication.dosage || '',
        frequency: medication.frequency || '',
      });
    } else {
      reset({
        name: '',
        dosage: '',
        frequency: '',
      });
    }
  }, [medication, reset, isVisible]);

  const handleFormSubmit = async (data: MedicationFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {medication ? 'Edit Medication' : 'Add Medication'}
            </Text>
            <Button
              title="✕"
              variant="outline"
              size="sm"
              onPress={onClose}
              style={styles.closeBtn}
            />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Medication Name *"
                  placeholder="e.g. Albuterol, Lisinopril, Metformin"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="dosage"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Dosage"
                  placeholder="e.g. 10 mg, 90 mcg, 500 mg"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.dosage?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="frequency"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Frequency"
                  placeholder="e.g. Once daily, Every 6 hours as needed"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.frequency?.message}
                />
              )}
            />

            <Button
              title={medication ? 'Update Medication' : 'Save Medication'}
              onPress={handleSubmit(handleFormSubmit)}
              isLoading={isSubmitting}
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    minHeight: 36,
    width: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  submitBtn: {
    marginTop: 12,
    marginBottom: 24,
  },
});
