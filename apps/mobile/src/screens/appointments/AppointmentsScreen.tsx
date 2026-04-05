import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsService } from '../../services';
import { Card, StatusBadge, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Appointment, AppointmentStatus, AppointmentType } from '../../types';
import { MainStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const typeLabels: Record<AppointmentType, string> = {
  EYE_EXAM: 'Examen',
  CONTACT_LENS: 'Lentilles',
  PICKUP: 'Retrait',
  REPAIR: 'Réparation',
  OTHER: 'Autre',
};

const typeColors: Record<AppointmentType, { bg: string; text: string }> = {
  EYE_EXAM: { bg: '#f3e8ff', text: '#7c3aed' },
  CONTACT_LENS: { bg: '#cffafe', text: '#0891b2' },
  PICKUP: { bg: '#fef3c7', text: '#d97706' },
  REPAIR: { bg: '#ffedd5', text: '#ea580c' },
  OTHER: { bg: '#f1f5f9', text: '#64748b' },
};

const statusColors: Record<AppointmentStatus, { bg: string; text: string }> = {
  SCHEDULED: { bg: '#dbeafe', text: '#2563eb' },
  CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
  COMPLETED: { bg: '#f1f5f9', text: '#64748b' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['appointments', { status: statusFilter }],
    queryFn: () => appointmentsService.getAll({ status: statusFilter || undefined, limit: 50 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderAppointment = ({ item }: { item: Appointment }) => (
      <Card 
        style={styles.appointmentCard}
        onPress={() => (navigation as any).navigate('AppointmentDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColors[item.appointmentType].bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColors[item.appointmentType].text }]}>
              {typeLabels[item.appointmentType]}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status].bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[item.status].text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.clientInfo}>
          <Ionicons name="person-outline" size={16} color={colors.light.textSecondary} />
          <Text style={styles.clientName}>
            {item.client?.firstName} {item.client?.lastName}
          </Text>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.light.textSecondary} />
            <Text style={styles.dateTimeText}>{formatDate(item.scheduledAt)}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color={colors.light.textSecondary} />
            <Text style={styles.dateTimeText}>{formatTime(item.scheduledAt)}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="hourglass-outline" size={16} color={colors.light.textSecondary} />
            <Text style={styles.dateTimeText}>{item.durationMinutes} min</Text>
          </View>
        </View>

        {(item.status === 'SCHEDULED' || item.status === 'CONFIRMED') && (
          <View style={styles.actions}>
            {item.status === 'SCHEDULED' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton, 
                  styles.confirmButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'CONFIRMED' })}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton, 
                styles.completeButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'COMPLETED' })}
            >
              <Text style={styles.completeButtonText}>Terminer</Text>
            </Pressable>
          </View>
        )}
      </Card>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['SCHEDULED', 'CONFIRMED', 'COMPLETED'] as AppointmentStatus[]).map((status) => {
          const statusLabels: Record<string, string> = {
            SCHEDULED: 'Planifié',
            CONFIRMED: 'Confirmé',
            COMPLETED: 'Terminé',
          };
          return (
            <Pressable
              key={status}
              style={({ pressed }) => [
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setStatusFilter(statusFilter === status ? null : status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {statusLabels[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={data?.appointments || []}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Aucun rendez-vous"
            message="Aucun rendez-vous trouvé"
            actionLabel="Nouveau RDV"
            onAction={() => navigation.navigate('AppointmentQuickCreate', {})}
          />
        }
      />

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigation.navigate('AppointmentQuickCreate', {})}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.surfaceSecondary,
  },
  filterChipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  filterChipActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  appointmentCard: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '500',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  clientName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.light.text,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateTimeText: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  confirmButton: {
    backgroundColor: '#dcfce7',
  },
  confirmButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#16a34a',
  },
  completeButton: {
    backgroundColor: '#f1f5f9',
  },
  completeButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#64748b',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.95,
  },
});
