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
import { allergySchema, AllergyFormData } from '../../types/validation';
import { Allergy } from '../../types/clinical';
import { Input, Button } from '../../components';

interface AllergyFormModalProps {
  isVisible: boolean;
  allergy?: Allergy | null;
  onClose: () => void;
  onSubmit: (data: AllergyFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE'];

export const AllergyFormModal: React.FC<AllergyFormModalProps> = ({
  isVisible,
  allergy,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      substance: '',
      severity: '',
      reaction: '',
    },
  });

  useEffect(() => {
    if (allergy) {
      reset({
        substance: allergy.substance,
        severity: allergy.severity || '',
        reaction: allergy.reaction || '',
      });
    } else {
      reset({
        substance: '',
        severity: '',
        reaction: '',
      });
    }
  }, [allergy, reset, isVisible]);

  const handleFormSubmit = async (data: AllergyFormData) => {
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
              {allergy ? 'Edit Allergy' : 'Add Allergy'}
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
              name="substance"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Allergen / Substance *"
                  placeholder="e.g. Penicillin, Peanuts, Bee Venom"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.substance?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="severity"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerSection}>
                  <Text style={styles.sectionLabel}>Severity</Text>
                  <View style={styles.pillContainer}>
                    {SEVERITIES.map((sev) => (
                      <Button
                        key={sev}
                        title={sev}
                        size="sm"
                        variant={value === sev ? 'primary' : 'outline'}
                        onPress={() => onChange(sev)}
                        style={styles.pill}
                      />
                    ))}
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="reaction"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Reaction / Symptoms"
                  placeholder="e.g. Hives, difficulty breathing, rash"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.reaction?.message}
                />
              )}
            />

            <Button
              title={allergy ? 'Update Allergy' : 'Save Allergy'}
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
    gap: 8,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: 14,
  },
  submitBtn: {
    marginTop: 12,
    marginBottom: 24,
  },
});
