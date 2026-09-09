import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useMedications } from '../../../hooks/useMedications';
import { MedicationCard } from '../../../features/patient/MedicationCard';
import { MedicationFormModal } from '../../../features/patient/MedicationFormModal';
import { Medication } from '../../../types/clinical';
import { MedicationFormData } from '../../../types/validation';
import { Button, LoadingSpinner, ErrorBanner, EmptyState } from '../../../components';

export default function MedicationsScreen() {
  const {
    medications,
    isLoading,
    error,
    loadMedications,
    createMedication,
    updateMedication,
    deleteMedication,
  } = useMedications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to remove this medication from your emergency record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMedication(id);
          },
        },
      ]
    );
  };

  const handleModalSubmit = async (data: MedicationFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingMed) {
        return await updateMedication(editingMed.id, data);
      } else {
        return await createMedication(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && medications.length === 0) {
    return <LoadingSpinner message="Loading medications..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadMedications} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Medications & Dosages</Text>
          <Text style={styles.pageSubtitle}>
            List vital prescriptions and life-saving medications (such as inhalers, insulin, or heart
            medications).
          </Text>
        </View>
        <Button
          title="+ Add Medication"
          onPress={handleOpenAdd}
          size="sm"
          style={styles.addBtn}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {medications.length === 0 ? (
        <EmptyState
          title="No Medications Recorded"
          description="You haven't listed any medications yet. Recording active medications helps emergency personnel prevent dangerous drug interactions."
          actionTitle="+ Add Medication Now"
          onAction={handleOpenAdd}
        />
      ) : (
        medications.map((item) => (
          <MedicationCard
            key={item.id}
            medication={item}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      <MedicationFormModal
        isVisible={isModalOpen}
        medication={editingMed}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitles: {
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  },
  addBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
