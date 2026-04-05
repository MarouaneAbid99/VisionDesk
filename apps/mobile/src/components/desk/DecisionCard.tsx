import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface DecisionCardProps {
  // Counts from unified business logic
  pendingOrders: number;      // CONFIRMED - waiting for atelier
  inAtelierOrders: number;    // IN_ATELIER - being worked on
  readyOrders: number;        // READY only
  completedToday?: number;    // PICKED_UP + DELIVERED today
}

/**
 * Decision Card - Answers "What should I do next?"
 * 
 * Visual hierarchy:
 * 1. READY (green) - ACTION REQUIRED - most prominent
 * 2. IN_ATELIER (orange) - in progress
 * 3. CONFIRMED (blue) - waiting
 * 4. COMPLETED (gray) - done, low emphasis
 */
export function DecisionCard({
  pendingOrders,
  inAtelierOrders,
  readyOrders,
  completedToday = 0,
}: DecisionCardProps) {
  const navigation = useNavigation<any>();

  // ACTION-FIRST categories with human, actionable language
  const categories = [
    {
      key: 'ready',
      label: 'À remettre maintenant',
      sublabel: 'Clients en attente',
      actionHint: '→ Voir les commandes',
      count: readyOrders,
      icon: 'hand-left',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      status: 'READY',
      priority: readyOrders > 0 ? 1 : 4,
      actionRequired: true,
    },
    {
      key: 'atelier',
      label: 'En fabrication',
      sublabel: 'Travaux en cours',
      actionHint: '→ Suivre l\'avancement',
      count: inAtelierOrders,
      icon: 'construct',
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      status: 'IN_ATELIER',
      priority: 2,
      actionRequired: false,
    },
    {
      key: 'pending',
      label: 'À lancer',
      sublabel: 'Prêtes pour l\'atelier',
      actionHint: '→ Envoyer en fabrication',
      count: pendingOrders,
      icon: 'play-circle',
      color: '#4f46e5',
      bgColor: '#eef2ff',
      borderColor: '#c7d2fe',
      status: 'CONFIRMED',
      priority: 3,
      actionRequired: pendingOrders > 0,
    },
    {
      key: 'completed',
      label: 'Terminées aujourd\'hui',
      sublabel: 'Retirées + livrées',
      actionHint: '→ Voir l\'historique',
      count: completedToday,
      icon: 'checkmark-done',
      color: '#64748b',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      status: 'COMPLETED',
      priority: 5,
      actionRequired: false,
    },
  ];

  // Sort by priority (ready first if has items)
  const sortedCategories = [...categories].sort((a, b) => a.priority - b.priority);

  const handleCategoryPress = (category: typeof categories[0]) => {
    if (category.key === 'atelier') {
      navigation.navigate('Atelier');
    } else {
      navigation.navigate('Orders', { statusFilter: category.status });
    }
  };

  const totalActive = pendingOrders + inAtelierOrders + readyOrders;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="layers" size={20} color={colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Commandes</Text>
            <Text style={styles.headerSubtitle}>
              {totalActive} active{totalActive !== 1 ? 's' : ''}
              {readyOrders > 0 && (
                <Text style={styles.headerHighlight}> • {readyOrders} à livrer</Text>
              )}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.headerActionText}>Tout voir</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.light.primary} />
        </Pressable>
      </View>

      {/* Decision Grid - 2x2 layout */}
      <View style={styles.grid}>
        {sortedCategories.map((category) => {
          const isHighlighted = category.actionRequired && category.count > 0;
          const isEmpty = category.count === 0;
          
          return (
            <Pressable
              key={category.key}
              style={({ pressed }) => [
                styles.categoryCard,
                { 
                  backgroundColor: isEmpty ? colors.light.surfaceSecondary : category.bgColor,
                  borderColor: isEmpty ? colors.light.border : category.borderColor,
                },
                isHighlighted && styles.categoryCardHighlighted,
                pressed && styles.categoryCardPressed,
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              {/* Action indicator for ready orders */}
              {isHighlighted && (
                <View style={styles.actionIndicator}>
                  <View style={styles.actionDot} />
                </View>
              )}
              
              <View style={styles.categoryHeader}>
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: isEmpty ? colors.light.border : category.color + '20' }
                ]}>
                  <Ionicons 
                    name={category.icon as any} 
                    size={18} 
                    color={isEmpty ? colors.light.textMuted : category.color} 
                  />
                </View>
                <Text style={[
                  styles.categoryCount,
                  { color: isEmpty ? colors.light.textMuted : category.color },
                  isHighlighted && styles.categoryCountHighlighted,
                ]}>
                  {category.count}
                </Text>
              </View>
              
              <Text style={[
                styles.categoryLabel,
                isEmpty && styles.categoryLabelMuted,
              ]}>
                {category.label}
              </Text>
              <Text style={styles.categorySublabel}>{category.sublabel}</Text>
              {!isEmpty && (
                <Text style={[styles.categoryActionHint, { color: category.color }]}>
                  {category.actionHint}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Quick Action - New Order */}
      <Pressable
        style={({ pressed }) => [styles.newOrderButton, pressed && styles.newOrderButtonPressed]}
        onPress={() => navigation.navigate('OrderQuickCreate')}
      >
        <LinearGradient
          colors={['#4f46e5', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.newOrderGradient}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.newOrderText}>Nouvelle commande</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </Pressable>
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
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.light.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  headerHighlight: {
    color: '#16a34a',
    fontWeight: '600',
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerActionPressed: {
    opacity: 0.7,
  },
  headerActionText: {
    ...typography.caption,
    color: colors.light.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryCard: {
    width: '48.5%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    position: 'relative',
  },
  categoryCardHighlighted: {
    borderWidth: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCount: {
    ...typography.h2,
    fontWeight: '700',
  },
  categoryCountHighlighted: {
    fontSize: 28,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  categoryLabelMuted: {
    color: colors.light.textMuted,
  },
  categorySublabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  categoryActionHint: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
    fontSize: 11,
  },
  newOrderButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  newOrderButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  newOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  newOrderText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
});
