import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useConditions } from '../../../hooks/useConditions';
import { ConditionCard } from '../../../features/patient/ConditionCard';
import { ConditionFormModal } from '../../../features/patient/ConditionFormModal';
import { Condition } from '../../../types/clinical';
import { ConditionFormData } from '../../../types/validation';
import { Button, LoadingSpinner, ErrorBanner, EmptyState } from '../../../components';

export default function ConditionsScreen() {
  const {
    conditions,
    isLoading,
    error,
    loadConditions,
    createCondition,
    updateCondition,
    deleteCondition,
  } = useConditions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingCondition(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (condition: Condition) => {
    setEditingCondition(condition);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Medical Condition',
      'Are you sure you want to remove this condition from your emergency record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCondition(id);
          },
        },
      ]
    );
  };

  const handleModalSubmit = async (data: ConditionFormData): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (editingCondition) {
        return await updateCondition(editingCondition.id, data);
      } else {
        return await createCondition(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && conditions.length === 0) {
    return <LoadingSpinner message="Loading conditions..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadConditions} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Medical Conditions</Text>
          <Text style={styles.pageSubtitle}>
            Track chronic illnesses and medical diagnoses (e.g. asthma, diabetes, heart disease) so
            first responders understand your background immediately.
          </Text>
        </View>
        <Button
          title="+ Add Condition"
          onPress={handleOpenAdd}
          size="sm"
          style={styles.addBtn}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {conditions.length === 0 ? (
        <EmptyState
          title="No Conditions Recorded"
          description="You haven't recorded any medical conditions. If you have chronic conditions, listing them helps emergency teams provide accurate care."
          actionTitle="+ Add Condition Now"
          onAction={handleOpenAdd}
        />
      ) : (
        conditions.map((item) => (
          <ConditionCard
            key={item.id}
            condition={item}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      <ConditionFormModal
        isVisible={isModalOpen}
        condition={editingCondition}
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
