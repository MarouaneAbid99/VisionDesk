import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Modal } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ordersService, InvoiceData } from '../../services';
import { Card, StatusBadge, LoadingScreen } from '../../components/ui';
import { PaymentModal, InvoiceView, PaymentHistory } from '../../components/orders';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatDate, formatCurrency, getFullName } from '../../utils';
import { MainStackScreenProps } from '../../navigation/types';
import { OrderStatus, PaymentStatus } from '../../types';

type RouteProps = MainStackScreenProps<'OrderDetail'>['route'];

interface QuickAction {
  status: OrderStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  UNPAID: { label: 'Non payée', color: '#dc2626', bgColor: '#fee2e2' },
  PARTIAL: { label: 'Acompte versé', color: '#d97706', bgColor: '#fef3c7' },
  PAID: { label: 'Payée', color: '#16a34a', bgColor: '#dcfce7' },
};

export function OrderDetailScreen() {
  const route = useRoute<RouteProps>();
  const { id } = route.params;
  const queryClient = useQueryClient();
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showPaymentHistory, setShowPaymentHistory] = useState(true);
  
  // Invoice modal state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  
  // Animation for paid celebration
  const celebrationAnim = useRef(new Animated.Value(0)).current;

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersService.getById(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersService.updateStatus(id, status),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['orders', id] });
      const previousOrder = queryClient.getQueryData(['orders', id]);
      queryClient.setQueryData(['orders', id], (old: any) => old ? { ...old, status: newStatus } : old);
      return { previousOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      queryClient.invalidateQueries({ queryKey: ['atelier'] });
    },
    onError: (error: any, _, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['orders', id], context.previousOrder);
      }
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le statut');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (amount: number) => ordersService.addPayment(id, amount),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['orders', id], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      queryClient.invalidateQueries({ queryKey: ['businessIntelligence'] });
      
      setShowPaymentModal(false);
      setPaymentError('');
      
      // Check if fully paid for celebration
      if (updatedOrder.paymentStatus === 'PAID') {
        // Trigger celebration animation
        Animated.sequence([
          Animated.timing(celebrationAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(celebrationAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
        
        Toast.show({
          type: 'success',
          text1: '🎉 Paiement complet !',
          text2: 'La commande est entièrement payée',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Paiement enregistré',
          text2: 'Acompte mis à jour',
          visibilityTime: 2000,
        });
      }
    },
    onError: (error: any) => {
      setPaymentError(error.response?.data?.message || 'Erreur lors du paiement');
    },
  });

  const handlePayment = (amount: number) => {
    setPaymentError('');
    paymentMutation.mutate(amount);
  };

  const handleShowInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const data = await ordersService.getInvoice(id);
      setInvoiceData(data);
      setShowInvoice(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la facture');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleStatusChange = (action: QuickAction) => {
    Alert.alert(
      'Confirmer',
      `Voulez-vous ${action.label.toLowerCase()} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => updateStatusMutation.mutate(action.status) },
      ]
    );
  };

  const getQuickActions = (): QuickAction[] => {
    if (!order) return [];
    const actions: QuickAction[] = [];

    switch (order.status) {
      case 'DRAFT':
        actions.push({
          status: 'CONFIRMED',
          label: 'Confirmer commande',
          icon: 'checkmark-outline',
          color: '#4f46e5',
          bgColor: '#eef2ff',
        });
        break;
      case 'CONFIRMED':
        actions.push({
          status: 'IN_ATELIER',
          label: 'Démarrer atelier',
          icon: 'construct-outline',
          color: '#d97706',
          bgColor: '#fef3c7',
        });
        break;
      case 'IN_ATELIER':
        actions.push({
          status: 'READY',
          label: 'Marquer prête',
          icon: 'checkmark-circle-outline',
          color: '#16a34a',
          bgColor: '#dcfce7',
        });
        break;
      case 'READY':
        actions.push({
          status: 'PICKED_UP',
          label: 'Marquer retirée',
          icon: 'bag-check-outline',
          color: '#2563eb',
          bgColor: '#dbeafe',
        });
        break;
      case 'PICKED_UP':
        actions.push({
          status: 'DELIVERED',
          label: 'Marquer livrée',
          icon: 'checkmark-done-outline',
          color: '#7c3aed',
          bgColor: '#f5f3ff',
        });
        break;
    }

    return actions;
  };

  const quickActions = getQuickActions();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Commande non trouvée</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} type="order" />
      </View>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.status}
              style={[styles.quickActionButton, { backgroundColor: action.bgColor }]}
              onPress={() => handleStatusChange(action)}
              disabled={updateStatusMutation.isPending}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text style={[styles.quickActionText, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <Card>
          {order.client ? (
            <>
              <Text style={styles.clientName}>
                {getFullName(order.client.firstName, order.client.lastName)}
              </Text>
              {order.client.phone && (
                <Text style={styles.clientInfo}>{order.client.phone}</Text>
              )}
              {order.client.email && (
                <Text style={styles.clientInfo}>{order.client.email}</Text>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>Client non spécifié</Text>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails</Text>
        <Card>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date de commande</Text>
            <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
          </View>
          {order.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date prévue</Text>
              <Text style={styles.detailValue}>{formatDate(order.dueDate)}</Text>
            </View>
          )}
          {order.notes && (
            <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={[styles.detailValue, { marginTop: spacing.xs }]}>{order.notes}</Text>
            </View>
          )}
        </Card>
      </View>

      {order.frame && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monture</Text>
          <Card>
            <View style={styles.productRow}>
              <Ionicons name="glasses-outline" size={24} color={colors.light.primary} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {order.frame.brand?.name || ''} {order.frame.reference}
                </Text>
                {order.frame.color && (
                  <Text style={styles.productDetail}>Couleur: {order.frame.color}</Text>
                )}
              </View>
              <Text style={styles.productPrice}>{formatCurrency(order.framePrice)}</Text>
            </View>
          </Card>
        </View>
      )}

      {order.lens && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verres</Text>
          <Card>
            <View style={styles.productRow}>
              <Ionicons name="eye-outline" size={24} color={colors.light.secondary} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {order.lens.name} {order.lens.lensType || ''}
                </Text>
                {order.lens.coating && (
                  <Text style={styles.productDetail}>Traitement: {order.lens.coating}</Text>
                )}
                {order.lens.index && (
                  <Text style={styles.productDetail}>Indice: {order.lens.index}</Text>
                )}
              </View>
              <Text style={styles.productPrice}>{formatCurrency(order.lensPrice)}</Text>
            </View>
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ordonnance</Text>
        <Card>
          {!order.prescriptionId ? (
            <Text style={styles.emptyText}>Aucune ordonnance liée à cette commande</Text>
          ) : order.prescription ? (
            <>
              <Text style={styles.rxDate}>Du {formatDate(order.prescription.createdAt)}</Text>
              <View style={styles.rxGrid}>
                <View style={styles.rxEye}>
                  <Text style={styles.rxEyeLabel}>OD (Droit)</Text>
                  <Text style={styles.rxValue}>
                    Sph: {order.prescription.odSph ?? '—'} | Cyl: {order.prescription.odCyl ?? '—'} | Axe:{' '}
                    {order.prescription.odAxis ?? '—'}
                  </Text>
                </View>
                <View style={styles.rxEye}>
                  <Text style={styles.rxEyeLabel}>OS (Gauche)</Text>
                  <Text style={styles.rxValue}>
                    Sph: {order.prescription.osSph ?? '—'} | Cyl: {order.prescription.osCyl ?? '—'} | Axe:{' '}
                    {order.prescription.osAxis ?? '—'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Référence ordonnance invalide ou supprimée</Text>
          )}
        </Card>
      </View>

      {order.atelierJob && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atelier</Text>
          <Card>
            <View style={styles.atelierHeader}>
              <Text style={styles.atelierLabel}>Statut atelier</Text>
              <StatusBadge status={order.atelierJob.status} type="atelier" size="sm" />
            </View>
            {order.atelierJob.notes && (
              <Text style={styles.atelierNotes}>{order.atelierJob.notes}</Text>
            )}
          </Card>
        </View>
      )}

      {/* Payment Section */}
      <Animated.View style={[
        styles.section,
        {
          transform: [{
            scale: celebrationAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.02],
            }),
          }],
        },
      ]}>
        <Text style={styles.sectionTitle}>Paiement</Text>
        <Card>
          {/* Payment Status Badge */}
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatusLabel}>Statut</Text>
            <View style={[
              styles.paymentBadge,
              { backgroundColor: PAYMENT_STATUS_CONFIG[order.paymentStatus || 'UNPAID'].bgColor }
            ]}>
              <Text style={[
                styles.paymentBadgeText,
                { color: PAYMENT_STATUS_CONFIG[order.paymentStatus || 'UNPAID'].color }
              ]}>
                {PAYMENT_STATUS_CONFIG[order.paymentStatus || 'UNPAID'].label}
              </Text>
            </View>
          </View>

          {/* Payment Details Grid */}
          <View style={styles.paymentGrid}>
            <View style={styles.paymentGridItem}>
              <Text style={styles.paymentGridLabel}>Total</Text>
              <Text style={styles.paymentGridValue}>{formatCurrency(order.totalPrice)}</Text>
            </View>
            <View style={styles.paymentGridItem}>
              <Text style={styles.paymentGridLabel}>Versé</Text>
              <Text style={[styles.paymentGridValue, { color: colors.light.success }]}>
                {formatCurrency(order.deposit || 0)}
              </Text>
            </View>
            <View style={styles.paymentGridItem}>
              <Text style={styles.paymentGridLabel}>Reste</Text>
              <Text style={[
                styles.paymentGridValue,
                { color: (order.totalPrice - (order.deposit || 0)) > 0 ? '#dc2626' : colors.light.success }
              ]}>
                {formatCurrency(order.totalPrice - (order.deposit || 0))}
              </Text>
            </View>
          </View>

          {/* Encaisser Button */}
          {(order.paymentStatus !== 'PAID') && (
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="wallet-outline" size={20} color="#fff" />
              <Text style={styles.paymentButtonText}>Encaisser</Text>
            </TouchableOpacity>
          )}

          {/* Paid indicator */}
          {order.paymentStatus === 'PAID' && (
            <View style={styles.paidIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.paidIndicatorText}>Paiement complet</Text>
            </View>
          )}

          {/* Payment history (collapsible) */}
          <View style={{ marginTop: spacing.sm }}>
            <PaymentHistory
              orderId={id}
              expanded={showPaymentHistory}
              onToggle={() => setShowPaymentHistory((v) => !v)}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Tarification Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail tarification</Text>
        <Card>
          <View style={styles.pricingLockNotice}>
            <Ionicons name="lock-closed" size={14} color={colors.light.textMuted} />
            <Text style={styles.pricingLockText}>Tarification figée après création</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Monture</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.framePrice ?? 0)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Verres</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.lensPrice ?? 0)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service de montage</Text>
            <Text style={styles.priceValue}>{formatCurrency(order.servicePrice ?? 0)}</Text>
          </View>
          {order.discount != null && order.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Remise</Text>
              <Text style={[styles.priceValue, { color: colors.light.success }]}>
                -{formatCurrency(order.discount)}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalPrice)}</Text>
          </View>
        </Card>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShowInvoice}
            disabled={loadingInvoice}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.light.primary} />
            <Text style={styles.actionButtonText}>
              {loadingInvoice ? 'Chargement...' : 'Facture'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: spacing.xl }} />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        remainingAmount={order.totalPrice - (order.deposit || 0)}
        isLoading={paymentMutation.isPending}
        error={paymentError}
      />

      {/* Invoice Modal */}
      <Modal
        visible={showInvoice}
        animationType="slide"
        onRequestClose={() => setShowInvoice(false)}
      >
        {invoiceData && (
          <InvoiceView
            data={invoiceData}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  orderNumber: {
    ...typography.h3,
    color: colors.light.text,
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  quickActionText: {
    ...typography.label,
    fontWeight: '600',
  },
  section: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientName: {
    ...typography.h4,
    color: colors.light.text,
  },
  clientInfo: {
    ...typography.body,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.light.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.light.text,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    ...typography.label,
    color: colors.light.text,
  },
  productDetail: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  productPrice: {
    ...typography.label,
    color: colors.light.text,
  },
  rxDate: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
  },
  rxGrid: {
    gap: spacing.sm,
  },
  rxEye: {
    backgroundColor: colors.light.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  rxEyeLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  rxValue: {
    ...typography.bodySmall,
    color: colors.light.text,
  },
  atelierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atelierLabel: {
    ...typography.body,
    color: colors.light.textSecondary,
  },
  atelierNotes: {
    ...typography.bodySmall,
    color: colors.light.text,
    marginTop: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  pricingLockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  pricingLockText: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontWeight: '600',
  },
  priceLabel: {
    ...typography.body,
    color: colors.light.textSecondary,
  },
  priceValue: {
    ...typography.body,
    color: colors.light.text,
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.h4,
    color: colors.light.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.light.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.light.textMuted,
  },
  errorText: {
    ...typography.body,
    color: colors.light.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentStatusLabel: {
    ...typography.body,
    color: colors.light.textSecondary,
  },
  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  paymentBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  paymentGrid: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  paymentGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentGridLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  paymentGridValue: {
    ...typography.h4,
    color: colors.light.text,
    fontWeight: '700',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  paymentButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  paidIndicatorText: {
    ...typography.label,
    color: '#16a34a',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.primary,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.label,
    color: colors.light.primary,
    fontWeight: '600',
  },
});
