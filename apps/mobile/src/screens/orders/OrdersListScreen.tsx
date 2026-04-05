import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ordersService } from '../../services';
import { Card, StatusBadge, LoadingScreen, EmptyState } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AnimatedPressable } from '../../components/ui';
import { formatDate, formatCurrency, getFullName } from '../../utils';
import { Order, OrderStatus } from '../../types';
import { MainStackParamList } from '../../navigation/types';

type OrderFilterStatus = OrderStatus | 'COMPLETED';

// Status filters aligned with unified business logic
const STATUS_FILTERS: { label: string; value: OrderFilterStatus | '' }[] = [
  { label: 'Toutes', value: '' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'Confirmées', value: 'CONFIRMED' },      // En attente (waiting for atelier)
  { label: 'En atelier', value: 'IN_ATELIER' },     // Currently being worked on
  { label: 'Prêtes', value: 'READY' },              // Ready for pickup
  { label: 'Terminées', value: 'COMPLETED' },       // PICKED_UP + DELIVERED
  { label: 'Annulées', value: 'CANCELLED' },        // Cancelled
];

type OrdersScreenRouteProp = RouteProp<MainStackParamList, 'Orders'>;

export function OrdersListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<OrdersScreenRouteProp>();
  const [search, setSearch] = useState('');
  
  // Read statusFilter from route params, default to ''
  const initialFilter = (route.params?.statusFilter as OrderFilterStatus) || '';
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus | ''>(initialFilter);
  
  // Update filter when route params change (e.g., navigating from CommandesHub)
  useEffect(() => {
    if (route.params?.statusFilter !== undefined) {
      setStatusFilter((route.params.statusFilter as OrderFilterStatus) || '');
    }
  }, [route.params?.statusFilter]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', { search, status: statusFilter }],
    queryFn: () =>
      ordersService.getAll({
        search,
        status: statusFilter || undefined,
        limit: 50,
      }),
  });

  const allOrders = data?.items || [];
  const groupedSections = React.useMemo(() => {
    const active = allOrders.filter((o) => ['DRAFT', 'CONFIRMED', 'IN_ATELIER'].includes(o.status));
    const ready = allOrders.filter((o) => ['READY', 'READY_FOR_PICKUP'].includes(o.status));
    const completed = allOrders.filter((o) => ['PICKED_UP', 'DELIVERED'].includes(o.status));
    const cancelled = allOrders.filter((o) => o.status === 'CANCELLED');
    return [
      { title: 'Commandes actives', data: active },
      { title: 'Prêtes à remettre', data: ready },
      { title: 'Terminées', data: completed },
      { title: 'Annulées', data: cancelled },
    ].filter((s) => s.data.length > 0);
  }, [allOrders]);

  const shouldGroupByStatus = !search.trim() && !statusFilter;

  const renderOrder = ({ item }: { item: Order }) => (
      <Card 
        variant="elevated"
        style={styles.orderCard}
        onPress={() => (navigation as any).navigate('OrderDetail', { id: item.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <StatusBadge status={item.status} type="order" size="sm" />
        </View>
        {item.client && (
          <Text style={styles.clientName}>
            {getFullName(item.client.firstName, item.client.lastName)}
          </Text>
        )}
        <View style={styles.orderDetails}>
          {item.frame && (
            <Text style={styles.detailText} numberOfLines={1}>
              {item.frame.brand?.name || ''} {item.frame.reference}
            </Text>
          )}
        </View>
        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.orderFinanceLine}>
              Versé {formatCurrency(item.deposit || 0)} · Reste {formatCurrency(Math.max(0, item.totalPrice - (item.deposit || 0)))}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.orderPrice}>{formatCurrency(item.totalPrice)}</Text>
            <Text style={styles.paymentStateText}>
              {item.paymentStatus === 'PAID' ? 'Payée' : item.paymentStatus === 'PARTIAL' ? 'Acompte' : 'Non payée'}
            </Text>
          </View>
        </View>
      </Card>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.light.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une commande..."
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

      {shouldGroupByStatus ? (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              <Text style={styles.sectionHeaderCount}>{section.data.length}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="Aucune commande"
              message="Aucune commande enregistrée"
              actionLabel="Nouvelle commande"
              onAction={() => navigation.navigate('OrderQuickCreate')}
            />
          }
        />
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="Aucune commande"
              message={search || statusFilter ? 'Aucun résultat pour ces filtres' : 'Aucune commande enregistrée'}
              actionLabel="Nouvelle commande"
              onAction={() => navigation.navigate('OrderQuickCreate')}
            />
          }
        />
      )}

      {/* FAB for creating new order */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigation.navigate('OrderQuickCreate')}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
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
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '700',
    fontSize: 15,
  },
  clientName: {
    ...typography.body,
    color: colors.light.text,
    fontWeight: '500',
  },
  orderDetails: {
    marginTop: spacing.xs,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.borderLight,
  },
  orderDate: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  orderFinanceLine: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
  orderPrice: {
    ...typography.label,
    color: colors.light.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  paymentStateText: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderTitle: {
    ...typography.caption,
    color: colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  sectionHeaderCount: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontWeight: '700',
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
