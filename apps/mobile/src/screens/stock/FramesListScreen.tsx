import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stockService } from '../../services';
import { Card, Badge, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { Frame } from '../../types';

export function FramesListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['frames', { search, lowStock: showLowStock }],
    queryFn: () =>
      stockService.getFrames({
        search,
        lowStock: showLowStock || undefined,
        limit: 100,
      }),
  });

  const renderFrame = ({ item }: { item: Frame }) => {
    const isLowStock = item.quantity <= item.reorderLevel;

    return (
        <Card 
          style={styles.itemCard}
          onPress={() => navigation.navigate('FrameForm', { frameId: item.id })}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemIcon}>
              <Ionicons name="glasses-outline" size={24} color={colors.light.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemBrand}>{item.brand?.name || 'Sans marque'}</Text>
              <Text style={styles.itemRef}>{item.reference}</Text>
            </View>
            {isLowStock && <Badge label="Stock bas" variant="error" size="sm" />}
          </View>
          <View style={styles.itemDetails}>
            {item.color && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Couleur</Text>
                <Text style={styles.detailValue}>{item.color}</Text>
              </View>
            )}
            {item.supplier && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fournisseur</Text>
                <Text style={styles.detailValue}>{item.supplier.name}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>En stock</Text>
              <Text style={[styles.detailValue, isLowStock && { color: colors.light.error }]}>{item.quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prix</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.salePrice)}</Text>
            </View>
          </View>
        </Card>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une monture..."
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

      <Pressable
        style={({ pressed }) => [
          styles.filterToggle,
          pressed && styles.filterTogglePressed,
        ]}
        onPress={() => setShowLowStock(!showLowStock)}
      >
        <Ionicons
          name={showLowStock ? 'checkbox' : 'square-outline'}
          size={20}
          color={colors.light.primary}
        />
        <Text style={styles.filterToggleText}>Afficher uniquement stock bas</Text>
      </Pressable>

      <FlatList
        data={data?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderFrame}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <EmptyState
            icon="glasses-outline"
            title="Aucune monture"
            message={search || showLowStock ? 'Aucun résultat pour ces filtres' : 'Aucune monture en stock'}
          />
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('FrameForm')}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    margin: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterTogglePressed: {
    opacity: 0.7,
  },
  filterToggleText: {
    ...typography.bodySmall,
    color: colors.light.text,
    marginLeft: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemBrand: {
    ...typography.label,
    color: colors.light.text,
  },
  itemRef: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
  },
  itemDetails: {
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  detailValue: {
    ...typography.caption,
    color: colors.light.text,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
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
