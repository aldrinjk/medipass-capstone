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
import { conditionSchema, ConditionFormData } from '../../types/validation';
import { Condition } from '../../types/clinical';
import { Input, Button } from '../../components';

interface ConditionFormModalProps {
  isVisible: boolean;
  condition?: Condition | null;
  onClose: () => void;
  onSubmit: (data: ConditionFormData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const STATUSES = ['ACTIVE', 'INACTIVE', 'RESOLVED'];

export const ConditionFormModal: React.FC<ConditionFormModalProps> = ({
  isVisible,
  condition,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConditionFormData>({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      name: '',
      status: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (condition) {
      reset({
        name: condition.name,
        status: condition.status || '',
        notes: condition.notes || '',
      });
    } else {
      reset({
        name: '',
        status: '',
        notes: '',
      });
    }
  }, [condition, reset, isVisible]);

  const handleFormSubmit = async (data: ConditionFormData) => {
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
              {condition ? 'Edit Condition' : 'Add Condition'}
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
                  label="Condition Name *"
                  placeholder="e.g. Asthma, Hypertension, Diabetes Type 2"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerSection}>
                  <Text style={styles.sectionLabel}>Status</Text>
                  <View style={styles.pillContainer}>
                    {STATUSES.map((st) => (
                      <Button
                        key={st}
                        title={st}
                        size="sm"
                        variant={value === st ? 'primary' : 'outline'}
                        onPress={() => onChange(st)}
                        style={styles.pill}
                      />
                    ))}
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes"
                  placeholder="e.g. Triggered by seasonal changes"
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.notes?.message}
                />
              )}
            />

            <Button
              title={condition ? 'Update Condition' : 'Save Condition'}
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
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  submitBtn: {
    marginTop: 12,
    marginBottom: 24,
  },
});
