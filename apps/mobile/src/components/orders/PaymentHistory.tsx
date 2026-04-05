import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ordersService, PaymentRecord } from '../../services/orders';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';

interface PaymentHistoryProps {
  orderId: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export function PaymentHistory({ orderId, expanded = false, onToggle }: PaymentHistoryProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', orderId],
    queryFn: () => ordersService.getPaymentHistory(orderId),
    enabled: true,
  });

  const paymentCount = payments?.length || 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={20} color={colors.light.textSecondary} />
          <Text style={styles.headerTitle}>Historique des paiements</Text>
          {paymentCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{paymentCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.light.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.light.primary} />
            </View>
          ) : payments && payments.length > 0 ? (
            <View style={styles.paymentsList}>
              {payments.map((payment, index) => (
                <View
                  key={payment.id}
                  style={[
                    styles.paymentItem,
                    index < payments.length - 1 && styles.paymentItemBorder,
                  ]}
                >
                  <View style={styles.paymentIcon}>
                    <Ionicons name="wallet" size={16} color={colors.light.success} />
                  </View>
                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentAmount}>
                        +{formatCurrency(payment.amount)}
                      </Text>
                      <Text style={styles.paymentDate}>
                        {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.paymentBy}>
                      Par {payment.createdBy.firstName} {payment.createdBy.lastName}
                    </Text>
                    {payment.notes && (
                      <Text style={styles.paymentNotes}>{payment.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun paiement enregistré</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.label,
    color: colors.light.text,
  },
  countBadge: {
    backgroundColor: colors.light.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  countText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  paymentsList: {
    padding: spacing.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  paymentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    ...typography.label,
    color: colors.light.success,
    fontWeight: '700',
  },
  paymentDate: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  paymentBy: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
  paymentNotes: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.light.textMuted,
  },
});
