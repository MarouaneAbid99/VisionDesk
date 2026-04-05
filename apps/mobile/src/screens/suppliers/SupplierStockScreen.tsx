import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MainStackScreenProps } from '../../navigation/types';
import { stockService } from '../../services';
import { Card, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { Frame, Lens } from '../../types';

type RouteProps = MainStackScreenProps<'SupplierStock'>['route'];

interface SupplierStockSummary {
  framesCount: number;
  lensesCount: number;
  totalItems: number;
  inStockUnits: number;
}

export function SupplierStockScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<any>();
  const { supplierId, supplierName } = route.params;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'frames' | 'lenses'>('frames');

  const { data: framesData, isLoading: framesLoading } = useQuery({
    queryKey: ['supplier-frames', supplierId, search],
    queryFn: () =>
      stockService.getFrames({
        supplierId,
        search: search || undefined,
        limit: 100,
      }),
  });

  const { data: lensesData, isLoading: lensesLoading } = useQuery({
    queryKey: ['supplier-lenses', supplierId, search],
    queryFn: () =>
      stockService.getLenses({
        supplierId,
        search: search || undefined,
        limit: 100,
      }),
  });

  const frames = framesData?.items || [];
  const lenses = lensesData?.items || [];

  const summary: SupplierStockSummary = {
    framesCount: framesData?.total || 0,
    lensesCount: lensesData?.total || 0,
    totalItems: (framesData?.total || 0) + (lensesData?.total || 0),
    inStockUnits:
      frames.reduce((sum, f) => sum + (f.quantity || 0), 0) +
      lenses.reduce((sum, l) => sum + (l.quantity || 0), 0),
  };

  const isLoading = framesLoading || lensesLoading;

  const renderFrame = ({ item }: { item: Frame }) => {
    const isLowStock = item.quantity <= item.reorderLevel;
    const purchase = Number(item.purchasePrice) || 0;
    const sale = Number(item.salePrice) || 0;

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => navigation.navigate('FrameForm', { frameId: item.id })}
      >
        <View style={styles.productHeader}>
          <View style={styles.productIcon}>
            <Ionicons name="glasses-outline" size={20} color={colors.light.primary} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {`${item.brand?.name || ''} ${item.reference}`.trim()}
            </Text>
            {item.color && <Text style={styles.productMeta}>{item.color}</Text>}
          </View>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Stock bas</Text>
            </View>
          )}
        </View>
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>En stock</Text>
            <Text style={[styles.detailValue, isLowStock && { color: colors.light.error }]}>
              {item.quantity}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix achat</Text>
            <Text style={styles.detailValue}>{formatCurrency(purchase)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix vente</Text>
            <Text style={[styles.detailValue, { color: colors.light.primary, fontWeight: '700' }]}>
              {formatCurrency(sale)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Marge/unité</Text>
            <Text style={[styles.detailValue, { color: colors.light.success }]}>
              {formatCurrency(sale - purchase)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderLens = ({ item }: { item: Lens }) => {
    const isLowStock = item.quantity <= item.reorderLevel;
    const purchase = Number(item.purchasePrice) || 0;
    const sale = Number(item.salePrice) || 0;

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => navigation.navigate('LensForm', { lensId: item.id })}
      >
        <View style={styles.productHeader}>
          <View style={[styles.productIcon, { backgroundColor: colors.light.secondaryBg }]}>
            <Ionicons name="eye-outline" size={20} color={colors.light.secondary} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lensType && <Text style={styles.productMeta}>{item.lensType}</Text>}
          </View>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Stock bas</Text>
            </View>
          )}
        </View>
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>En stock</Text>
            <Text style={[styles.detailValue, isLowStock && { color: colors.light.error }]}>
              {item.quantity}
            </Text>
          </View>
          {item.index && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Indice</Text>
              <Text style={styles.detailValue}>{item.index}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix achat</Text>
            <Text style={styles.detailValue}>{formatCurrency(purchase)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix vente</Text>
            <Text style={[styles.detailValue, { color: colors.light.primary, fontWeight: '700' }]}>
              {formatCurrency(sale)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Marge/unité</Text>
            <Text style={[styles.detailValue, { color: colors.light.success }]}>
              {formatCurrency(sale - purchase)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.light.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Stock de {supplierName}</Text>
          <Text style={styles.headerSub}>Produits liés à ce fournisseur</Text>
        </View>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{isLoading ? '...' : summary.framesCount}</Text>
            <Text style={styles.summaryLabel}>Montures</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{isLoading ? '...' : summary.lensesCount}</Text>
            <Text style={styles.summaryLabel}>Verres</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{isLoading ? '...' : summary.totalItems}</Text>
            <Text style={styles.summaryLabel}>Articles liés</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{isLoading ? '...' : summary.inStockUnits}</Text>
            <Text style={styles.summaryLabel}>Unités</Text>
          </View>
        </View>
      </Card>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher dans ce stock..."
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

      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'frames' && styles.tabActive]}
          onPress={() => setActiveTab('frames')}
        >
          <Ionicons
            name="glasses-outline"
            size={18}
            color={activeTab === 'frames' ? colors.light.primary : colors.light.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'frames' && styles.tabTextActive]}>
            Montures ({summary.framesCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'lenses' && styles.tabActive]}
          onPress={() => setActiveTab('lenses')}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={activeTab === 'lenses' ? colors.light.primary : colors.light.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'lenses' && styles.tabTextActive]}>
            Verres ({summary.lensesCount})
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : activeTab === 'frames' ? (
        <FlatList
          data={frames}
          keyExtractor={(item) => item.id}
          renderItem={renderFrame}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="glasses-outline"
              title="Aucune monture"
              message={`Aucune monture liée à ${supplierName}`}
            />
          }
        />
      ) : (
        <FlatList
          data={lenses}
          keyExtractor={(item) => item.id}
          renderItem={renderLens}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="eye-outline"
              title="Aucun verre"
              message={`Aucun verre lié à ${supplierName}`}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    ...shadows.sm,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.light.text,
    fontWeight: '700',
  },
  headerSub: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h4,
    color: colors.light.text,
    fontWeight: '800',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  tabActive: {
    backgroundColor: colors.light.primaryBg,
    borderColor: colors.light.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.light.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.light.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  productCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadows.sm,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  productMeta: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  lowStockBadge: {
    backgroundColor: colors.light.errorBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  lowStockText: {
    ...typography.caption,
    color: colors.light.error,
    fontWeight: '600',
    fontSize: 10,
  },
  productDetails: {
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  detailValue: {
    ...typography.caption,
    color: colors.light.text,
    fontWeight: '600',
  },
});
