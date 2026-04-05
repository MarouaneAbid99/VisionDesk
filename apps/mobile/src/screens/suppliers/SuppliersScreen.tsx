import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { suppliersService } from '../../services';
import { Card, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Supplier } from '../../types';
import { useToast } from '../../contexts';
import { SupplierFormModal } from './SupplierFormModal';

export function SuppliersScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suppliers', { search }],
    queryFn: () => suppliersService.getAll({ search, limit: 100 }),
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const suppliers = data?.items || [];
  useEffect(() => {
    if (__DEV__ && !isLoading && suppliers.length === 0) {
      console.log('[SuppliersScreen] liste vide après chargement — vérifier shopId / forme API');
    }
  }, [isLoading, suppliers.length]);
  const withPhone = useMemo(() => suppliers.filter((s) => Boolean(s.phone)).length, [suppliers]);
  const withEmail = useMemo(() => suppliers.filter((s) => Boolean(s.email)).length, [suppliers]);

  const createMutation = useMutation({
    mutationFn: suppliersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showSuccess('Fournisseur créé');
      setShowCreateModal(false);
    },
    onError: (error: any) => showError(error?.response?.data?.message || 'Création impossible'),
  });

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <Card variant="elevated" style={styles.itemCard} onPress={() => navigation.navigate('SupplierDetail', { id: item.id })}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIcon}>
          <Ionicons name="business-outline" size={22} color={colors.light.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>{item.contact || 'Contact non renseigné'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.light.textMuted} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Téléphone</Text>
          <Text style={styles.detailValue}>{item.phone || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>E-mail</Text>
          <Text style={styles.detailValue}>{item.email || '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Adresse</Text>
          <Text style={styles.detailValue}>{item.address || '—'}</Text>
        </View>
      </View>
    </Card>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{suppliers.length}</Text>
          <Text style={styles.statLabel}>Fournisseurs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{withPhone}</Text>
          <Text style={styles.statLabel}>Avec téléphone</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{withEmail}</Text>
          <Text style={styles.statLabel}>Avec e-mail</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un fournisseur..."
          placeholderTextColor={colors.light.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.light.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        renderItem={renderSupplier}
        onRefresh={refetch}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="Aucun fournisseur"
            message={search ? 'Aucun résultat pour cette recherche' : 'Commencez par créer un fournisseur sur Desk/Web'}
          />
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <SupplierFormModal
        visible={showCreateModal}
        title="Nouveau fournisseur"
        isSaving={createMutation.isPending}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  statValue: { ...typography.h4, color: colors.light.text, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.light.textMuted, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  itemCard: { marginBottom: spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: { flex: 1 },
  itemName: { ...typography.label, color: colors.light.text, fontWeight: '700' },
  itemSub: { ...typography.caption, color: colors.light.textSecondary, marginTop: 2 },
  details: {
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: spacing.sm },
  detailLabel: { ...typography.caption, color: colors.light.textMuted },
  detailValue: { ...typography.caption, color: colors.light.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
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
    transform: [{ scale: 0.93 }],
  },
});
