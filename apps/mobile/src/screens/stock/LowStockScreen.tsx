import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stockService } from '../../services';
import { Card, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Frame, Lens } from '../../types';

type StockItem = (Frame & { itemType: 'frame' }) | (Lens & { itemType: 'lens' });

export function LowStockScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'frames' | 'lenses'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => stockService.getLowStock(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getItems = (): StockItem[] => {
    if (!data) return [];
    
    const frames = (data.frames || []).map((f) => ({ ...f, itemType: 'frame' as const }));
    const lenses = (data.lenses || []).map((l) => ({ ...l, itemType: 'lens' as const }));
    
    if (activeTab === 'frames') return frames;
    if (activeTab === 'lenses') return lenses;
    return [...frames, ...lenses];
  };

  const renderItem = ({ item }: { item: StockItem }) => {
    const isFrame = item.itemType === 'frame';
    const frame = isFrame ? (item as Frame) : null;
    const lens = !isFrame ? (item as Lens) : null;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={[styles.typeBadge, { backgroundColor: isFrame ? '#dbeafe' : '#f3e8ff' }]}>
            <Text style={[styles.typeBadgeText, { color: isFrame ? '#2563eb' : '#7c3aed' }]}>
              {isFrame ? 'Frame' : 'Lens'}
            </Text>
          </View>
          <View style={[
            styles.stockBadge,
            { backgroundColor: item.quantity === 0 ? '#fee2e2' : '#fef3c7' }
          ]}>
            <Text style={[
              styles.stockBadgeText,
              { color: item.quantity === 0 ? '#dc2626' : '#d97706' }
            ]}>
              {item.quantity} in stock
            </Text>
          </View>
        </View>

        <Text style={styles.itemName}>
          {isFrame ? `${frame?.brand?.name || ''} ${frame?.reference}`.trim() : lens?.name}
        </Text>
        <Text style={styles.itemDetails}>
          {isFrame ? `${frame?.model || ''} - ${frame?.color || ''}` : `${lens?.lensType} - ${lens?.coating}`}
        </Text>

        <View style={styles.itemFooter}>
          <View style={styles.reorderInfo}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.light.textSecondary} />
            <Text style={styles.reorderText}>Reorder at: {item.reorderLevel}</Text>
          </View>
          {item.supplier && (
            <Text style={styles.supplierText}>{item.supplier.name}</Text>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const items = getItems();

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data?.frames?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Frames</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data?.lenses?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Lenses</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.light.error }]}>
            {data?.totalLowStock || 0}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {(['all', 'frames', 'lenses'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="Stock is healthy"
            message="No items are below reorder level"
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.light.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h3,
    color: colors.light.text,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.light.border,
    marginVertical: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  tabActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  stockBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: spacing.xs,
  },
  itemDetails: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  reorderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reorderText: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  supplierText: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
});
