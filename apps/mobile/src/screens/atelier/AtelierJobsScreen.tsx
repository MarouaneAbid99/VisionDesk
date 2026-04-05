import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { atelierService } from '../../services';
import { Card, StatusBadge, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatDate, getFullName } from '../../utils';
import { AtelierJob, AtelierStatus } from '../../types';

const STATUS_FILTERS: { label: string; value: AtelierStatus | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Prêt', value: 'READY' },
];

const STATUS_OPTIONS: { label: string; value: AtelierStatus }[] = [
  { label: 'En attente', value: 'PENDING' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Prêt', value: 'READY' },
];

const ATELIER_PIPELINE: { key: AtelierStatus; label: string }[] = [
  { key: 'PENDING', label: 'En attente' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'READY', label: 'Prêt' },
];

const workflowStyles = StyleSheet.create({
  strip: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  stripTitle: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCol: {
    alignItems: 'center',
    minWidth: 72,
  },
  disc: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.light.border,
    marginBottom: 6,
  },
  discDone: {
    backgroundColor: colors.light.success,
  },
  discCurrent: {
    backgroundColor: colors.light.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 5,
  },
  stepLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.light.textSecondary,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: colors.light.primary,
    fontWeight: '700',
  },
  stepLabelMuted: {
    color: colors.light.textMuted,
    fontWeight: '500',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.light.border,
    marginBottom: 18,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  connectorDone: {
    backgroundColor: colors.light.successLight,
  },
});

function AtelierWorkflowStrip({ status }: { status: AtelierStatus }) {
  const activeIdx = ATELIER_PIPELINE.findIndex((s) => s.key === status);
  const safeIdx = activeIdx >= 0 ? activeIdx : 0;

  return (
    <View style={workflowStyles.strip}>
      <Text style={workflowStyles.stripTitle}>Parcours atelier</Text>
      <View style={workflowStyles.row}>
        {ATELIER_PIPELINE.map((step, i) => {
          const isPast = safeIdx > i;
          const isCurrent = safeIdx === i;
          return (
            <React.Fragment key={step.key}>
              <View style={workflowStyles.stepCol}>
                <View
                  style={[
                    workflowStyles.disc,
                    isPast && workflowStyles.discDone,
                    isCurrent && workflowStyles.discCurrent,
                  ]}
                />
                <Text
                  style={[
                    workflowStyles.stepLabel,
                    isCurrent && workflowStyles.stepLabelCurrent,
                    !isCurrent && !isPast && workflowStyles.stepLabelMuted,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
              {i < ATELIER_PIPELINE.length - 1 && (
                <View style={[workflowStyles.connector, isPast && workflowStyles.connectorDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

export function AtelierJobsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AtelierStatus | ''>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['atelier', 'jobs', { status: statusFilter }],
    queryFn: () =>
      atelierService.getJobs({
        status: statusFilter || undefined,
        limit: 50,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AtelierStatus }) =>
      atelierService.updateJobStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atelier'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le statut');
    },
  });

  const handleStatusChange = (job: AtelierJob) => {
    Alert.alert(
      'Changer le statut',
      `Commande: ${job.order?.orderNumber || 'N/A'}`,
      STATUS_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => {
          if (option.value !== job.status) {
            updateStatusMutation.mutate({ id: job.id, status: option.value });
          }
        },
        style: (option.value === job.status ? 'cancel' : 'default') as 'cancel' | 'default',
      })).concat([{ text: 'Annuler', style: 'cancel' as const, onPress: () => {} }])
    );
  };

  const jobs = data?.items || [];
  const pendingCount = jobs.filter((j) => j.status === 'PENDING').length;
  const inProgressCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const readyCount = jobs.filter((j) => j.status === 'READY').length;

  const renderJob = ({ item }: { item: AtelierJob }) => (
    <Card style={styles.jobCard} variant="elevated">
      <View style={styles.jobHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.order?.orderNumber || '—'}</Text>
          {item.order?.client && (
            <Text style={styles.clientName}>
              {getFullName(item.order.client.firstName, item.order.client.lastName)}
            </Text>
          )}
        </View>
        <StatusBadge status={item.status} type="atelier" />
      </View>

      <AtelierWorkflowStrip status={item.status} />

      {item.order?.frame && (
        <View style={styles.productRow}>
          <Ionicons name="glasses-outline" size={16} color={colors.light.textSecondary} />
          <Text style={styles.productText}>
            {item.order.frame.brand?.name || ''} {item.order.frame.reference}
          </Text>
        </View>
      )}

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      <View style={styles.jobFooter}>
        <View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          {Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)) >= 3 && (
            <Text style={styles.overdueText}>En attente prolongée</Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.statusButton,
            pressed && styles.statusButtonPressed,
          ]}
          onPress={() => handleStatusChange(item)}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.light.primary} />
          <Text style={styles.statusButtonText}>Changer statut</Text>
        </Pressable>
      </View>
    </Card>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.pipelineSummary}>
        <View style={styles.pipelineStat}>
          <Text style={styles.pipelineValue}>{pendingCount}</Text>
          <Text style={styles.pipelineLabel}>En attente</Text>
        </View>
        <View style={styles.pipelineStat}>
          <Text style={styles.pipelineValue}>{inProgressCount}</Text>
          <Text style={styles.pipelineLabel}>En cours</Text>
        </View>
        <View style={styles.pipelineStat}>
          <Text style={styles.pipelineValue}>{readyCount}</Text>
          <Text style={styles.pipelineLabel}>Prêtes</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map((filter) => (
          <Pressable
            key={filter.value}
            style={({ pressed }) => [
              styles.filterChip,
              statusFilter === filter.value && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="Aucun travail"
            message={statusFilter ? 'Aucun travail avec ce statut' : 'Aucun travail en atelier'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pipelineSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  pipelineStat: { flex: 1, alignItems: 'center' },
  pipelineValue: { ...typography.h4, color: colors.light.text, fontWeight: '700' },
  pipelineLabel: { ...typography.caption, color: colors.light.textMuted },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  filterChipActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primaryDark,
  },
  filterText: {
    ...typography.caption,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  jobCard: {
    marginBottom: spacing.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...typography.label,
    color: colors.light.text,
  },
  clientName: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productText: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginLeft: spacing.xs,
  },
  notes: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  dateText: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  overdueText: {
    ...typography.caption,
    color: colors.light.error,
    marginTop: 2,
    fontWeight: '600',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.light.primaryBg,
    borderRadius: borderRadius.md,
  },
  statusButtonText: {
    ...typography.caption,
    color: colors.light.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statusButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
