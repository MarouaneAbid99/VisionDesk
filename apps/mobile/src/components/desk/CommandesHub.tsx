import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface CommandesHubProps {
  // Active orders = orders in progress (CONFIRMED, IN_ATELIER, READY)
  activeOrders: number;
  // Ready for pickup (READY)
  readyOrders: number;
  // Currently in atelier (IN_ATELIER only)
  inAtelierOrders: number;
  // Waiting for atelier (CONFIRMED only)
  pendingOrders: number;
  // Orders created today (informational)
  ordersToday?: number;
  todayRevenue?: number;
  recentOrders?: any[];
  onFilterChange?: (filter: string) => void;
}

type FilterType = 'all' | 'ready' | 'atelier' | 'pending';

export function CommandesHub({
  activeOrders,
  readyOrders,
  inAtelierOrders,
  pendingOrders,
  ordersToday = 0,
  todayRevenue = 0,
  recentOrders = [],
  onFilterChange,
}: CommandesHubProps) {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Determine urgency - what needs attention
  const hasUrgent = readyOrders > 0;
  const hasWork = inAtelierOrders > 0;

  // Filter chips with CORRECT business logic counts
  const filters: { key: FilterType; label: string; count: number; icon: string; color: string; status?: string; urgent?: boolean }[] = [
    { key: 'all', label: 'En cours', count: activeOrders, icon: 'layers', color: '#4f46e5' },
    { key: 'ready', label: 'Prêtes', count: readyOrders, icon: 'checkmark-circle', color: '#16a34a', status: 'READY', urgent: readyOrders > 0 },
    { key: 'atelier', label: 'Atelier', count: inAtelierOrders, icon: 'construct', color: '#d97706', status: 'IN_ATELIER' },
    { key: 'pending', label: 'En attente', count: pendingOrders, icon: 'time', color: '#6366f1', status: 'CONFIRMED' },
  ];

  const handleFilterPress = useCallback((filter: typeof filters[0]) => {
    setActiveFilter(filter.key);
    onFilterChange?.(filter.key);
    
    if (filter.key === 'atelier') {
      navigation.navigate('Atelier');
    } else {
      navigation.navigate('Orders', { statusFilter: filter.status || '' });
    }
  }, [navigation, onFilterChange]);

  const quickActions = [
    {
      id: 'new',
      icon: 'add-circle',
      label: 'Nouvelle commande',
      color: '#4f46e5',
      gradient: ['#4f46e5', '#6366f1'],
      onPress: () => navigation.navigate('OrderQuickCreate'),
    },
    {
      id: 'pickup',
      icon: 'hand-left',
      label: 'Retrait client',
      color: '#16a34a',
      gradient: ['#16a34a', '#22c55e'],
      onPress: () => navigation.navigate('Orders', { statusFilter: 'READY' }),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="cart" size={26} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Commandes</Text>
            <Text style={styles.headerSubtitle}>Centre de contrôle opérationnel</Text>
          </View>
        </View>
        <Pressable 
          style={({ pressed }) => [
            styles.headerAction,
            pressed && styles.headerActionPressed,
          ]}
          onPress={() => navigation.navigate('Orders')}
        >
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Business Stats Row - CORRECT counts */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ordersToday}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeOrders}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, hasUrgent && styles.statValueUrgent]}>{readyOrders}</Text>
          <Text style={styles.statLabel}>À retirer</Text>
        </View>
      </View>

      {/* Attention Banner */}
      {hasUrgent && (
        <Pressable 
          style={styles.attentionBanner}
          onPress={() => navigation.navigate('Orders', { statusFilter: 'READY' })}
        >
          <View style={styles.attentionIcon}>
            <Ionicons name="alert-circle" size={18} color="#16a34a" />
          </View>
          <Text style={styles.attentionText}>
            <Text style={styles.attentionCount}>{readyOrders}</Text> commande{readyOrders > 1 ? 's' : ''} prête{readyOrders > 1 ? 's' : ''} pour retrait
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#16a34a" />
        </Pressable>
      )}

      {/* Status Filter Chips */}
      <View style={styles.filtersSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            const isUrgent = filter.urgent && filter.count > 0;
            return (
              <Pressable
                key={filter.key}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && { backgroundColor: filter.color, borderColor: filter.color },
                  !isActive && { borderColor: filter.color },
                  isUrgent && !isActive && styles.filterChipUrgent,
                  pressed && styles.filterChipPressed,
                ]}
                onPress={() => handleFilterPress(filter)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color={isActive ? '#fff' : filter.color} 
                />
                <Text style={[
                  styles.filterLabel,
                  isActive && styles.filterLabelActive,
                  !isActive && { color: filter.color },
                ]}>
                  {filter.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  isActive ? styles.filterCountActive : { backgroundColor: filter.color + '20' },
                  isUrgent && !isActive && styles.filterCountUrgent,
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    isActive ? styles.filterCountTextActive : { color: filter.color },
                    isUrgent && !isActive && styles.filterCountTextUrgent,
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.quickActionButton,
              pressed && styles.quickActionPressed,
            ]}
            onPress={action.onPress}
            onPressIn={() => setPressedButton(action.id)}
            onPressOut={() => setPressedButton(null)}
          >
            <LinearGradient
              colors={action.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickActionGradient}
            >
              <Ionicons name={action.icon as any} size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.light.textMuted} />
          </Pressable>
        ))}
      </View>

      {/* Recent Orders Preview */}
      {recentOrders.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Activité récente</Text>
            <Pressable 
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.seeAll}>Voir tout →</Text>
            </Pressable>
          </View>
          {recentOrders.slice(0, 3).map((order, index) => (
            <Pressable
              key={order.id || index}
              style={({ pressed }) => [
                styles.recentOrder,
                pressed && styles.recentOrderPressed,
              ]}
              onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
            >
              <View style={styles.recentOrderLeft}>
                <View style={[styles.recentOrderDot, { backgroundColor: getStatusColor(order.status) }]} />
                <View style={styles.recentOrderInfo}>
                  <Text style={styles.recentOrderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.recentOrderClient}>
                    {order.client?.firstName} {order.client?.lastName}
                  </Text>
                </View>
              </View>
              <View style={[styles.recentOrderStatus, { backgroundColor: getStatusBg(order.status) }]}>
                <Text style={[styles.recentOrderStatusText, { color: getStatusColor(order.status) }]}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    DRAFT: '#64748b',
    CONFIRMED: '#4f46e5',
    IN_ATELIER: '#d97706',
    READY: '#16a34a',
    READY_FOR_PICKUP: '#16a34a',
    PICKED_UP: '#4f46e5',
    DELIVERED: '#7c3aed',
    CANCELLED: '#dc2626',
  };
  return statusColors[status] || '#64748b';
}

function getStatusBg(status: string): string {
  const statusBgs: Record<string, string> = {
    DRAFT: '#f1f5f9',
    CONFIRMED: '#eef2ff',
    IN_ATELIER: '#fffbeb',
    READY: '#f0fdf4',
    READY_FOR_PICKUP: '#f0fdf4',
    PICKED_UP: '#eef2ff',
    DELIVERED: '#f5f3ff',
    CANCELLED: '#fef2f2',
  };
  return statusBgs[status] || '#f1f5f9';
}

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    CONFIRMED: 'Confirmée',
    IN_ATELIER: 'Atelier',
    READY: 'Prête',
    READY_FOR_PICKUP: 'Prête',
    PICKED_UP: 'Retirée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };
  return statusLabels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingVertical: spacing.lg + 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionPressed: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ scale: 0.95 }],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.light.surfaceSecondary,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.light.text,
    fontWeight: '700',
  },
  statValueUrgent: {
    color: '#16a34a',
  },
  statLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.light.border,
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: spacing.sm,
  },
  attentionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionText: {
    ...typography.bodySmall,
    color: '#166534',
    flex: 1,
  },
  attentionCount: {
    fontWeight: '700',
  },
  filtersSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filtersScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    backgroundColor: colors.light.surface,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterChipUrgent: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  filterChipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  filterLabel: {
    ...typography.label,
    fontWeight: '600',
    fontSize: 13,
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: 2,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  filterCountTextActive: {
    color: '#fff',
  },
  filterCountUrgent: {
    backgroundColor: '#16a34a',
  },
  filterCountTextUrgent: {
    color: '#fff',
  },
  quickActionsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  quickActionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  quickActionGradient: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.light.text,
    fontWeight: '600',
    flex: 1,
  },
  recentSection: {
    borderTopWidth: 1,
    borderTopColor: colors.light.borderLight,
    padding: spacing.md,
    paddingTop: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  seeAll: {
    ...typography.caption,
    color: colors.light.primary,
    fontWeight: '700',
  },
  recentOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  recentOrderPressed: {
    opacity: 0.7,
    backgroundColor: colors.light.surfaceSecondary,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  recentOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentOrderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentOrderInfo: {
    gap: 2,
  },
  recentOrderNumber: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  recentOrderClient: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  recentOrderStatus: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  recentOrderStatusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
});
