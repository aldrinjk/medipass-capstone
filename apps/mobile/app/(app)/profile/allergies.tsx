import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAllergies } from '../../../hooks/useAllergies';
import { AllergyCard } from '../../../features/patient/AllergyCard';
import { AllergyFormModal } from '../../../features/patient/AllergyFormModal';
import { Allergy } from '../../../types/clinical';
import { AllergyFormData } from '../../../types/validation';
import { Button, LoadingSpinner, ErrorBanner, EmptyState } from '../../../components';

export default function AllergiesScreen() {
  const {
    allergies,
    isLoading,
    error,
    loadAllergies,
    createAllergy,
    updateAllergy,
    deleteAllergy,
  } = useAllergies();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingAllergy(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (allergy: Allergy) => {
    setEditingAllergy(allergy);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Allergy',
      'Are you sure you want to remove this allergy from your emergency record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAllergy(id);
          },
        },
      ]
    );
  };

  const handleModalSubmit = async (data: AllergyFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingAllergy) {
        return await updateAllergy(editingAllergy.id, data);
      } else {
        return await createAllergy(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && allergies.length === 0) {
    return <LoadingSpinner message="Loading allergies..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAllergies} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Allergies & Reactions</Text>
          <Text style={styles.pageSubtitle}>
            Document severe reactions (e.g. penicillin, peanuts) to safeguard against contraindicated
            drugs.
          </Text>
        </View>
        <Button
          title="+ Add Allergy"
          onPress={handleOpenAdd}
          size="sm"
          style={styles.addBtn}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {allergies.length === 0 ? (
        <EmptyState
          title="No Allergies Recorded"
          description="You haven't recorded any allergies yet. If you have any known medical or food allergies, add them here."
          actionTitle="+ Add Allergy Now"
          onAction={handleOpenAdd}
        />
      ) : (
        allergies.map((item) => (
          <AllergyCard
            key={item.id}
            allergy={item}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      <AllergyFormModal
        isVisible={isModalOpen}
        allergy={editingAllergy}
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
