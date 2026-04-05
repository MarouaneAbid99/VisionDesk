import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { formatCurrency } from '../../utils';

interface OwnerCardProps {
  // Booked revenue metrics (order value, excluding cancelled)
  bookedRevenueToday: number;
  bookedRevenueThisMonth: number;
  bookedRevenueGrowth: string | null;
  // Collected cash metrics (real payments)
  collectedCashToday: number;
  collectedCashThisMonth: number;
  // Completed revenue metrics (PICKED_UP + DELIVERED)
  completedRevenueToday: number;
  averageOrderValue: number;
  ordersThisMonth: number;
  // Financial awareness
  cashToCollect: number;
  cashComing: number;
  // Predictive
  ordersDueTomorrow: number;
  atelierStatus: 'normal' | 'busy' | 'overloaded';
  criticalStockItems: number;
  // Insights
  topClient: { name: string; ordersCount: number; totalSpent: number } | null;
  bestSellerFrame: { reference: string; brand?: string } | null;
}

/**
 * Owner Card - Business Control Center
 * Shows key business metrics, financial awareness, and predictive insights
 * Designed to make the owner feel in control of their business
 */
export function OwnerCard({
  bookedRevenueToday,
  bookedRevenueThisMonth,
  bookedRevenueGrowth,
  collectedCashToday,
  collectedCashThisMonth,
  completedRevenueToday,
  averageOrderValue,
  ordersThisMonth,
  cashToCollect,
  cashComing,
  ordersDueTomorrow,
  atelierStatus,
  criticalStockItems,
  topClient,
  bestSellerFrame,
}: OwnerCardProps) {
  const navigation = useNavigation<any>();

  // Determine growth indicator
  const growthValue = bookedRevenueGrowth ? parseFloat(bookedRevenueGrowth) : 0;
  const isPositiveGrowth = growthValue > 0;
  const hasGrowth = bookedRevenueGrowth !== null;

  // Select the most relevant ACTIONABLE insights (max 2)
  const insights: Array<{ 
    icon: string; 
    color: string; 
    text: string; 
    action: string;
    onPress: () => void;
  }> = [];
  
  // Predictive insight: Tomorrow's orders - ACTIONABLE
  if (ordersDueTomorrow > 0) {
    insights.push({
      icon: 'calendar-outline',
      color: '#4f46e5',
      text: `${ordersDueTomorrow} commande${ordersDueTomorrow > 1 ? 's' : ''} à livrer demain`,
      action: 'Préparer',
      onPress: () => navigation.navigate('Orders'),
    });
  }

  // Predictive insight: Atelier overload - ACTIONABLE
  if (atelierStatus === 'overloaded') {
    insights.push({
      icon: 'warning',
      color: '#dc2626',
      text: 'Atelier surchargé aujourd\'hui',
      action: 'Gérer',
      onPress: () => navigation.navigate('Atelier'),
    });
  } else if (atelierStatus === 'busy' && insights.length < 2) {
    insights.push({
      icon: 'construct',
      color: '#d97706',
      text: 'Atelier chargé aujourd\'hui',
      action: 'Voir',
      onPress: () => navigation.navigate('Atelier'),
    });
  }

  // Predictive insight: Critical stock - ACTIONABLE
  if (criticalStockItems > 0 && insights.length < 2) {
    insights.push({
      icon: 'cube',
      color: '#dc2626',
      text: `${criticalStockItems} produit${criticalStockItems > 1 ? 's' : ''} en rupture critique`,
      action: 'Commander',
      onPress: () => navigation.navigate('Stock'),
    });
  }

  // Smart insight: Top client - ACTIONABLE
  if (topClient && insights.length < 2) {
    insights.push({
      icon: 'star',
      color: '#f59e0b',
      text: `Meilleur client: ${topClient.name}`,
      action: 'Voir',
      onPress: () => navigation.navigate('Clients'),
    });
  }

  // Smart insight: Best seller - ACTIONABLE
  if (bestSellerFrame && insights.length < 2) {
    insights.push({
      icon: 'trending-up',
      color: '#16a34a',
      text: `Top vente: ${bestSellerFrame.brand ? bestSellerFrame.brand + ' ' : ''}${bestSellerFrame.reference}`,
      action: 'Stock',
      onPress: () => navigation.navigate('Stock'),
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="business" size={18} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Vue Propriétaire</Text>
        </View>
        {hasGrowth && (
          <View style={[
            styles.growthBadge,
            { backgroundColor: isPositiveGrowth ? '#dcfce7' : '#fee2e2' }
          ]}>
            <Ionicons 
              name={isPositiveGrowth ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={isPositiveGrowth ? '#16a34a' : '#dc2626'} 
            />
            <Text style={[
              styles.growthText,
              { color: isPositiveGrowth ? '#16a34a' : '#dc2626' }
            ]}>
              {isPositiveGrowth ? '+' : ''}{bookedRevenueGrowth}%
            </Text>
          </View>
        )}
      </View>

      {/* Main Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricMain}>
          <Text style={styles.metricMainValue}>{formatCurrency(bookedRevenueToday)}</Text>
          <Text style={styles.metricMainLabel}>CA réservé aujourd'hui</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricSecondary}>
          <Text style={styles.metricSecondaryValue}>{formatCurrency(bookedRevenueThisMonth)}</Text>
          <Text style={styles.metricSecondaryLabel}>CA réservé (mois)</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricSecondary}>
          <Text style={styles.metricSecondaryValue}>{ordersThisMonth}</Text>
          <Text style={styles.metricSecondaryLabel}>Commandes</Text>
        </View>
      </View>

      {/* Financial Awareness */}
      {(cashToCollect > 0 || cashComing > 0) && (
        <View style={styles.financialRow}>
          {cashToCollect > 0 && (
            <TouchableOpacity 
              style={styles.financialChip}
              onPress={() => navigation.navigate('Orders')}
            >
              <Ionicons name="wallet" size={14} color="#d97706" />
              <Text style={styles.financialChipText}>
                {formatCurrency(cashToCollect)} reste à encaisser
              </Text>
            </TouchableOpacity>
          )}
          {cashComing > 0 && (
            <TouchableOpacity 
              style={[styles.financialChip, styles.financialChipSuccess]}
              onPress={() => navigation.navigate('Orders', { statusFilter: 'READY' })}
            >
              <Ionicons name="cash" size={14} color="#16a34a" />
              <Text style={[styles.financialChipText, { color: '#16a34a' }]}>
                {formatCurrency(cashComing)} reste (commandes prêtes)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Revenue semantics row */}
      <View style={styles.financialRow}>
        <View style={styles.financialChip}>
          <Ionicons name="wallet-outline" size={14} color="#16a34a" />
          <Text style={[styles.financialChipText, { color: '#16a34a' }]}>
            Encaisse aujourd'hui: {formatCurrency(collectedCashToday)}
          </Text>
        </View>
      </View>
      <View style={styles.financialRow}>
        <View style={styles.financialChip}>
          <Ionicons name="cash-outline" size={14} color={colors.light.primary} />
          <Text style={[styles.financialChipText, { color: colors.light.primary }]}>
            Encaisse mois: {formatCurrency(collectedCashThisMonth)}
          </Text>
        </View>
      </View>
      <View style={styles.financialRow}>
        <View style={styles.financialChip}>
          <Ionicons name="checkmark-done-outline" size={14} color="#7c3aed" />
          <Text style={[styles.financialChipText, { color: '#7c3aed' }]}>
            CA termine aujourd'hui: {formatCurrency(completedRevenueToday)}
          </Text>
        </View>
      </View>

      {/* Actionable Insights (max 2) */}
      {insights.length > 0 && (
        <View style={styles.insightsSection}>
          {insights.slice(0, 2).map((insight, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.insightRow}
              onPress={insight.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.insightIcon, { backgroundColor: insight.color + '15' }]}>
                <Ionicons name={insight.icon as any} size={14} color={insight.color} />
              </View>
              <Text style={styles.insightText}>{insight.text}</Text>
              <View style={[styles.insightAction, { backgroundColor: insight.color + '15' }]}>
                <Text style={[styles.insightActionText, { color: insight.color }]}>
                  {insight.action}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={insight.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.light.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '700',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  growthText: {
    ...typography.caption,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metricMain: {
    flex: 1.5,
  },
  metricMainValue: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.light.success,
    fontWeight: '800',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  metricMainLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.light.border,
    marginHorizontal: spacing.sm,
  },
  metricSecondary: {
    flex: 1,
    alignItems: 'center',
  },
  metricSecondaryValue: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '700',
  },
  metricSecondaryLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontSize: 10,
  },
  financialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  financialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  financialChipSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  financialChipText: {
    ...typography.caption,
    color: '#d97706',
    fontWeight: '600',
  },
  insightsSection: {
    gap: spacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  insightText: {
    ...typography.caption,
    color: colors.light.textSecondary,
    flex: 1,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  insightActionText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
});
