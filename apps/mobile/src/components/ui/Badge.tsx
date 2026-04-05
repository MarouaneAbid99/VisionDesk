import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, spacing, typography, colors as themeColors } from '../../theme';
import { statusColors } from '../../theme/colors';
import { OrderStatus, AtelierStatus, AppointmentStatus } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface StatusBadgeProps {
  status: OrderStatus | AtelierStatus | AppointmentStatus;
  type: 'order' | 'atelier' | 'appointment';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'md', style }: BadgeProps) {
  const variantColors = {
    default: { bg: themeColors.light.surfaceSecondary, text: themeColors.light.textMuted, border: themeColors.light.border },
    success: { bg: themeColors.light.successBg, text: themeColors.light.success, border: themeColors.light.successLight },
    warning: { bg: themeColors.light.warningBg, text: themeColors.light.warning, border: themeColors.light.warningLight },
    error: { bg: themeColors.light.errorBg, text: themeColors.light.error, border: themeColors.light.errorLight },
    info: { bg: themeColors.light.infoBg, text: themeColors.light.info, border: themeColors.light.infoLight },
  };

  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status, type, size = 'md' }: StatusBadgeProps) {
  const getColors = () => {
    if (type === 'order') {
      return statusColors.order[status as OrderStatus];
    } else if (type === 'atelier') {
      return statusColors.atelier[status as AtelierStatus];
    } else {
      return statusColors.appointment?.[status as AppointmentStatus] || { bg: '#f1f5f9', text: '#64748b' };
    }
  };
  
  const colors = getColors();

  const statusLabel = (() => {
    const s = status as string;
    if (type === 'order') {
      const orderLabels: Record<string, string> = {
        DRAFT: 'Brouillon',
        CONFIRMED: 'Confirmée',
        IN_ATELIER: 'En atelier',
        READY: 'Prête',
        READY_FOR_PICKUP: 'Prête',
        PICKED_UP: 'Retirée',
        DELIVERED: 'Livrée',
        CANCELLED: 'Annulée',
      };
      return orderLabels[s] ?? s;
    }
    if (type === 'atelier') {
      const atelierLabels: Record<string, string> = {
        PENDING: 'En attente',
        IN_PROGRESS: 'En cours',
        READY: 'Prêt',
      };
      return atelierLabels[s] ?? s;
    }
    const apptLabels: Record<string, string> = {
      SCHEDULED: 'Planifié',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    };
    return apptLabels[s] ?? s;
  })();

  const borderTint =
    type === 'order'
      ? (statusColors.order[status as OrderStatus]?.text ?? themeColors.light.border) + '33'
      : type === 'atelier'
        ? (statusColors.atelier[status as AtelierStatus]?.text ?? themeColors.light.border) + '33'
        : themeColors.light.border;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: colors.bg, borderColor: borderTint },
      ]}
    >
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: colors.text }]}>
        {statusLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  textSm: {
    fontSize: 11,
  },
});
