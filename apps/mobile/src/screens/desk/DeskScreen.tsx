import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from '../../navigation/types';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { deskService } from '../../services';
import { Card, StatusBadge, LoadingScreen } from '../../components/ui';
import { DecisionCard } from '../../components/desk/DecisionCard';
import { OwnerCard } from '../../components/desk/OwnerCard';
import { NotificationBell } from '../../components/notifications';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatCurrency, formatDate, getFullName } from '../../utils';

export function DeskScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['desk', 'summary'],
    queryFn: deskService.getSummary,
  });

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['desk', 'recent-orders'],
    queryFn: deskService.getRecentOrders,
  });

  const { data: atelierQueue, refetch: refetchAtelier } = useQuery({
    queryKey: ['desk', 'atelier-queue'],
    queryFn: deskService.getAtelierQueue,
  });

  const { data: lowStock, refetch: refetchLowStock } = useQuery({
    queryKey: ['desk', 'low-stock'],
    queryFn: deskService.getLowStock,
  });

  const { data: todayAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['desk', 'appointments'],
    queryFn: deskService.getTodayAppointments,
  });

  const { data: overdueOrders, refetch: refetchOverdue } = useQuery({
    queryKey: ['desk', 'overdue-orders'],
    queryFn: deskService.getOverdueOrders,
  });

  const { data: delayedAtelier, refetch: refetchDelayed } = useQuery({
    queryKey: ['desk', 'delayed-atelier'],
    queryFn: deskService.getDelayedAtelier,
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['desk', 'orders-analytics'],
    queryFn: deskService.getOrdersAnalytics,
  });

  const { data: bestSellers, refetch: refetchBestSellers } = useQuery({
    queryKey: ['desk', 'best-sellers'],
    queryFn: deskService.getBestSellers,
  });

  // Business Intelligence data
  const { data: businessIntel, refetch: refetchBusinessIntel } = useQuery({
    queryKey: ['desk', 'business-intelligence'],
    queryFn: deskService.getBusinessIntelligence,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Check for alerts - using correct fields from unified business logic
  const hasAlerts = (summary?.overdueOrders ?? 0) > 0 || (summary?.urgentAtelierJobs ?? 0) > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchOrders(), refetchAtelier(), refetchLowStock(), refetchAppointments(), refetchOverdue(), refetchDelayed(), refetchAnalytics(), refetchBestSellers(), refetchBusinessIntel()]);
    setRefreshing(false);
  }, [refetchSummary, refetchOrders, refetchAtelier, refetchLowStock, refetchAppointments, refetchOverdue, refetchDelayed, refetchAnalytics, refetchBestSellers, refetchBusinessIntel]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (summaryLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.light.primary}
          colors={[colors.light.primary]}
        />
      }
    >
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Tableau de bord</Text>
            <Text style={styles.headerTime}>
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={32} color={colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================ */}
      {/* 🔴 ZONE 1: SMART TASK LIST - What to do next */}
      {/* ============================================ */}
      
      {(hasAlerts || (summary?.ordersReady ?? 0) > 0 || (summary?.lowStockItems ?? 0) > 0 || (summary?.ordersPending ?? 0) > 0) && (
        <View style={styles.priorityZone}>
          <View style={styles.priorityZoneShell}>
          <View style={styles.zoneHeader}>
            <View style={styles.zoneTitleRow}>
              <View style={[styles.zoneDot, { backgroundColor: '#dc2626' }]} />
              <View>
                <Text style={styles.zoneTitle}>À faire maintenant</Text>
                <Text style={styles.priorityZoneHint}>Actions prioritaires — comme un centre de contrôle</Text>
              </View>
            </View>
          </View>
          
          {/* TASK LIST - Actionable items */}
          <View style={styles.taskList}>
            {/* Task 1: Ready orders to deliver */}
            {(summary?.ordersReady ?? 0) > 0 && (
              <TouchableOpacity 
                style={[styles.taskItem, styles.taskItemUrgent]}
                onPress={() => navigation.navigate('Orders', { statusFilter: 'READY' })}
                activeOpacity={0.8}
              >
                <View style={[styles.taskIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="hand-left" size={20} color="#16a34a" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>
                    {summary?.ordersReady} commande{(summary?.ordersReady ?? 0) > 1 ? 's' : ''} à remettre
                  </Text>
                  <Text style={styles.taskSubtitle}>Clients en attente de leur commande</Text>
                </View>
                <View style={styles.taskAction}>
                  <Text style={[styles.taskActionText, { color: '#16a34a' }]}>Livrer</Text>
                  <Ionicons name="chevron-forward" size={16} color="#16a34a" />
                </View>
              </TouchableOpacity>
            )}

            {/* Task 2: Overdue orders */}
            {(summary?.overdueOrders ?? 0) > 0 && (
              <TouchableOpacity 
                style={[styles.taskItem, styles.taskItemCritical]}
                onPress={() => navigation.navigate('Orders', {})}
                activeOpacity={0.8}
              >
                <View style={[styles.taskIcon, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>
                    {summary?.overdueOrders} commande{(summary?.overdueOrders ?? 0) > 1 ? 's' : ''} en retard
                  </Text>
                  <Text style={styles.taskSubtitle}>Date de livraison dépassée</Text>
                </View>
                <View style={styles.taskAction}>
                  <Text style={[styles.taskActionText, { color: '#dc2626' }]}>Traiter</Text>
                  <Ionicons name="chevron-forward" size={16} color="#dc2626" />
                </View>
              </TouchableOpacity>
            )}

            {/* Task 3: Blocked atelier jobs */}
            {(summary?.urgentAtelierJobs ?? 0) > 0 && (
              <TouchableOpacity 
                style={[styles.taskItem, styles.taskItemCritical]}
                onPress={() => navigation.navigate('Atelier')}
                activeOpacity={0.8}
              >
                <View style={[styles.taskIcon, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="warning" size={20} color="#dc2626" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>
                    {summary?.urgentAtelierJobs} travail{(summary?.urgentAtelierJobs ?? 0) > 1 ? 'x' : ''} bloqué{(summary?.urgentAtelierJobs ?? 0) > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.taskSubtitle}>Problème en atelier à résoudre</Text>
                </View>
                <View style={styles.taskAction}>
                  <Text style={[styles.taskActionText, { color: '#dc2626' }]}>Débloquer</Text>
                  <Ionicons name="chevron-forward" size={16} color="#dc2626" />
                </View>
              </TouchableOpacity>
            )}

            {/* Task 4: Orders to send to atelier */}
            {(summary?.ordersPending ?? 0) > 0 && (
              <TouchableOpacity 
                style={styles.taskItem}
                onPress={() => navigation.navigate('Orders', { statusFilter: 'CONFIRMED' })}
                activeOpacity={0.8}
              >
                <View style={[styles.taskIcon, { backgroundColor: '#eef2ff' }]}>
                  <Ionicons name="play-circle" size={20} color="#4f46e5" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>
                    {summary?.ordersPending} commande{(summary?.ordersPending ?? 0) > 1 ? 's' : ''} à lancer
                  </Text>
                  <Text style={styles.taskSubtitle}>Prêtes pour l'atelier</Text>
                </View>
                <View style={styles.taskAction}>
                  <Text style={[styles.taskActionText, { color: '#4f46e5' }]}>Lancer</Text>
                  <Ionicons name="chevron-forward" size={16} color="#4f46e5" />
                </View>
              </TouchableOpacity>
            )}

            {/* Task 5: Low stock alert */}
            {(summary?.lowStockItems ?? 0) > 0 && (
              <TouchableOpacity 
                style={styles.taskItem}
                onPress={() => navigation.navigate('Stock', {})}
                activeOpacity={0.8}
              >
                <View style={[styles.taskIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="cube" size={20} color="#d97706" />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>
                    {summary?.lowStockItems} produit{(summary?.lowStockItems ?? 0) > 1 ? 's' : ''} en rupture
                  </Text>
                  <Text style={styles.taskSubtitle}>Stock critique à réapprovisionner</Text>
                </View>
                <View style={styles.taskAction}>
                  <Text style={[styles.taskActionText, { color: '#d97706' }]}>Commander</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d97706" />
                </View>
              </TouchableOpacity>
            )}
          </View>
          </View>
        </View>
      )}

      {/* ============================================ */}
      {/* 🟡 ZONE 2: OPERATIONS - Main working tools */}
      {/* ============================================ */}
      
      <View style={styles.operationsZone}>
        {/* Decision Card - Main Commandes Control */}
        {summary && (
          <DecisionCard
            pendingOrders={summary.ordersPending}
            inAtelierOrders={summary.ordersInAtelier}
            readyOrders={summary.ordersReady}
            completedToday={businessIntel?.financial.ordersCompletedToday ?? 0}
          />
        )}

        {/* Atelier Compact Card */}
        {summary && summary.atelierWorkload > 0 && (
          <TouchableOpacity 
            style={styles.atelierCompactCard}
            onPress={() => navigation.navigate('Atelier')}
            activeOpacity={0.8}
          >
            <View style={styles.atelierCompactLeft}>
              <View style={styles.atelierCompactIcon}>
                <Ionicons name="construct" size={20} color={colors.light.warning} />
              </View>
              <View>
                <Text style={styles.atelierCompactTitle}>Atelier</Text>
                <Text style={styles.atelierCompactSubtitle}>
                  {summary.atelierWorkload} travaux actifs
                  {(delayedAtelier?.length ?? 0) > 0 && (
                    <Text style={styles.atelierDelayedText}> • {delayedAtelier?.length} en retard</Text>
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.atelierCompactStats}>
              <View style={styles.atelierMiniStat}>
                <Text style={[styles.atelierMiniValue, { color: colors.light.warning }]}>{summary.ordersPending}</Text>
                <Text style={styles.atelierMiniLabel}>attente</Text>
              </View>
              <View style={styles.atelierMiniStat}>
                <Text style={[styles.atelierMiniValue, { color: colors.light.primary }]}>{summary.ordersInAtelier}</Text>
                <Text style={styles.atelierMiniLabel}>en cours</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.light.textMuted} />
          </TouchableOpacity>
        )}

        {/* Today's Appointments - Compact */}
        {todayAppointments && todayAppointments.length > 0 && (
          <TouchableOpacity 
            style={styles.appointmentsCompactCard}
            onPress={() => navigation.navigate('Appointments')}
            activeOpacity={0.8}
          >
            <View style={styles.appointmentsCompactLeft}>
              <View style={styles.appointmentsCompactIcon}>
                <Ionicons name="calendar" size={20} color={colors.light.secondary} />
              </View>
              <View>
                <Text style={styles.appointmentsCompactTitle}>Rendez-vous</Text>
                <Text style={styles.appointmentsCompactSubtitle}>
                  {todayAppointments.length} aujourd'hui
                </Text>
              </View>
            </View>
            <View style={styles.nextAppointment}>
              <Text style={styles.nextAppointmentTime}>
                {new Date(todayAppointments[0].scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.nextAppointmentLabel}>prochain</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.light.textMuted} />
          </TouchableOpacity>
        )}

        {/* Quick Actions - Simplified */}
        <View style={styles.quickActionsCompact}>
          <TouchableOpacity 
            style={styles.quickActionCompact}
            onPress={() => navigation.navigate('ClientQuickCreate')}
          >
            <View style={[styles.quickActionCompactIcon, { backgroundColor: colors.light.secondaryBg }]}>
              <Ionicons name="person-add" size={18} color={colors.light.secondary} />
            </View>
            <Text style={styles.quickActionCompactLabel}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCompact}
            onPress={() => navigation.navigate('AppointmentQuickCreate', {})}
          >
            <View style={[styles.quickActionCompactIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="calendar" size={18} color="#9333ea" />
            </View>
            <Text style={styles.quickActionCompactLabel}>RDV</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCompact}
            onPress={() => navigation.navigate('Stock', {})}
          >
            <View style={[styles.quickActionCompactIcon, { backgroundColor: colors.light.infoBg }]}>
              <Ionicons name="glasses" size={18} color={colors.light.info} />
            </View>
            <Text style={styles.quickActionCompactLabel}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCompact}
            onPress={() => navigation.navigate('Suppliers')}
          >
            <View style={[styles.quickActionCompactIcon, { backgroundColor: '#ecfeff' }]}>
              <Ionicons name="business-outline" size={18} color="#0891b2" />
            </View>
            <Text style={styles.quickActionCompactLabel}>Fourn.</Text>
          </TouchableOpacity>
          {(summary?.lowStockItems ?? 0) > 0 && (
            <TouchableOpacity 
              style={styles.quickActionCompact}
              onPress={() => navigation.navigate('Stock', {})}
            >
              <View style={[styles.quickActionCompactIcon, { backgroundColor: colors.light.errorBg }]}>
                <Ionicons name="alert" size={18} color={colors.light.error} />
              </View>
              <Text style={[styles.quickActionCompactLabel, { color: colors.light.error }]}>
                {summary?.lowStockItems}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ============================================ */}
      {/* 🔵 ZONE 3: BUSINESS INTELLIGENCE - Owner Mode */}
      {/* ============================================ */}
      
      <View style={styles.contextZone}>
        <View style={styles.zoneHeader}>
          <View style={styles.zoneTitleRow}>
            <View style={[styles.zoneDot, { backgroundColor: colors.light.primary }]} />
            <Text style={styles.zoneTitle}>Tableau de bord</Text>
          </View>
        </View>

        {/* OWNER CARD - Business Control Center */}
        {analytics && (
          <OwnerCard
            bookedRevenueToday={analytics.bookedRevenueToday ?? analytics.todayRevenue}
            bookedRevenueThisMonth={analytics.bookedRevenueThisMonth ?? analytics.revenueThisMonth}
            bookedRevenueGrowth={analytics.bookedRevenueGrowth ?? analytics.revenueGrowth}
            collectedCashToday={businessIntel?.financial.collectedCashToday ?? 0}
            collectedCashThisMonth={businessIntel?.financial.collectedCashThisMonth ?? 0}
            completedRevenueToday={businessIntel?.financial.completedTodayRevenue ?? 0}
            averageOrderValue={analytics.averageOrderValue}
            ordersThisMonth={analytics.ordersThisMonth}
            cashToCollect={businessIntel?.financial.cashToCollect ?? 0}
            cashComing={businessIntel?.financial.cashComing ?? 0}
            ordersDueTomorrow={businessIntel?.predictive.ordersDueTomorrow ?? 0}
            atelierStatus={businessIntel?.predictive.atelierStatus ?? 'normal'}
            criticalStockItems={businessIntel?.predictive.criticalStockItems ?? 0}
            topClient={businessIntel?.insights.topClient ?? null}
            bestSellerFrame={bestSellers?.frames?.[0] ? {
              reference: bestSellers.frames[0].reference,
              brand: bestSellers.frames[0].brand?.name,
            } : null}
          />
        )}

        {lowStock && ((lowStock.frames?.length ?? 0) > 0 || (lowStock.lenses?.length ?? 0) > 0) && (
          <View style={styles.contextCard}>
            <View style={styles.contextCardHeader}>
              <Text style={styles.contextCardTitle}>Alerte stock prioritaire</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Stock', { initialTab: 'alerts' })}>
                <Text style={styles.seeAllLink}>Voir stock</Text>
              </TouchableOpacity>
            </View>
            {[...(lowStock.frames || []).slice(0, 2), ...(lowStock.lenses || []).slice(0, 2)].slice(0, 3).map((item: any) => (
              <View key={item.id} style={styles.contextRow}>
                <View style={styles.contextRowLeft}>
                  <View style={[styles.statusDot, { backgroundColor: '#d97706' }]} />
                  <Text style={styles.contextRowLabel} numberOfLines={1}>
                    {item.reference ? `${item.brand?.name || ''} ${item.reference}`.trim() : item.name}
                  </Text>
                </View>
                <Text style={styles.contextRowValue}>Qté {item.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {atelierQueue && atelierQueue.length > 0 && (
          <View style={styles.contextCard}>
            <View style={styles.contextCardHeader}>
              <Text style={styles.contextCardTitle}>Atelier récent</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Atelier')}>
                <Text style={styles.seeAllLink}>Voir atelier</Text>
              </TouchableOpacity>
            </View>
            {atelierQueue.slice(0, 3).map((job: any) => (
              <View key={job.id} style={styles.contextRow}>
                <View style={styles.contextRowLeft}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.order?.status || 'DRAFT') }]} />
                  <Text style={styles.contextRowLabel}>
                    {job.order?.orderNumber || 'Commande'} · {job.order?.client ? getFullName(job.order.client.firstName, job.order.client.lastName) : 'Client'}
                  </Text>
                </View>
                <Text style={styles.contextRowValue}>{formatDate(job.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Activity - Simplified */}
        {recentOrders && recentOrders.length > 0 && (
          <View style={styles.recentOrdersCard}>
            <View style={styles.recentOrdersHeader}>
              <Text style={styles.recentOrdersTitle}>Dernière activité</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders', {})}>
                <Text style={styles.seeAllLink}>Historique →</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.slice(0, 3).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.recentOrderRow}
                onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
              >
                <View style={styles.recentOrderLeft}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                  <View>
                    <Text style={styles.recentOrderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.recentOrderClient}>
                      {order.client ? getFullName(order.client.firstName, order.client.lastName) : '—'}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentOrderRight}>
                  <Text style={styles.recentOrderPrice}>{formatCurrency(order.totalPrice)}</Text>
                  <Text style={[styles.recentOrderStatus, { color: getStatusColor(order.status) }]}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

// Helper functions for status display
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: '#64748b',
    CONFIRMED: '#4f46e5',
    IN_ATELIER: '#d97706',
    READY: '#16a34a',
    READY_FOR_PICKUP: '#16a34a',
    PICKED_UP: '#6366f1',
    DELIVERED: '#7c3aed',
    CANCELLED: '#dc2626',
  };
  return colors[status] || '#64748b';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    CONFIRMED: 'Confirmée',
    IN_ATELIER: 'Atelier',
    READY: 'Prête',
    READY_FOR_PICKUP: 'Prête',
    PICKED_UP: 'Retirée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  
  // ============================================
  // HEADER - Compact
  // ============================================
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.light.text,
    fontWeight: '700',
  },
  headerTime: {
    ...typography.caption,
    color: colors.light.primary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // ZONE HEADERS
  // ============================================
  zoneHeader: {
    marginBottom: spacing.sm,
  },
  zoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  zoneTitle: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============================================
  // ZONE 1: SMART TASK LIST
  // ============================================
  priorityZone: {
    marginBottom: spacing.lg,
  },
  priorityZoneShell: {
    backgroundColor: colors.light.primaryBg,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    ...shadows.sm,
  },
  priorityZoneHint: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  taskList: {
    gap: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  taskItemUrgent: {
    borderColor: '#bbf7d0',
    borderWidth: 2,
    backgroundColor: '#fafffe',
  },
  taskItemCritical: {
    borderColor: '#fecaca',
    borderWidth: 2,
    backgroundColor: '#fffafa',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  taskSubtitle: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  taskAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskActionText: {
    ...typography.caption,
    fontWeight: '700',
  },

  // ============================================
  // ZONE 2: OPERATIONS
  // ============================================
  operationsZone: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  
  // Atelier Compact Card
  atelierCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  atelierCompactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  atelierCompactIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atelierCompactTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  atelierCompactSubtitle: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  atelierDelayedText: {
    color: colors.light.error,
    fontWeight: '600',
  },
  atelierCompactStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  atelierMiniStat: {
    alignItems: 'center',
  },
  atelierMiniValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  atelierMiniLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontSize: 10,
  },

  // Appointments Compact Card
  appointmentsCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  appointmentsCompactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appointmentsCompactIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.secondaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentsCompactTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  appointmentsCompactSubtitle: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  nextAppointment: {
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  nextAppointmentTime: {
    ...typography.label,
    color: colors.light.secondary,
    fontWeight: '700',
  },
  nextAppointmentLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontSize: 10,
  },

  // Quick Actions Compact
  quickActionsCompact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  quickActionCompact: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionCompactIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionCompactLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
    fontWeight: '500',
  },

  // ============================================
  // ZONE 3: SMART INSIGHTS
  // ============================================
  contextZone: {
    marginBottom: spacing.md,
  },
  
  // Insights Card
  insightsCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
    gap: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  insightText: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    flex: 1,
  },
  insightHighlight: {
    color: colors.light.text,
    fontWeight: '700',
  },
  insightMuted: {
    color: colors.light.textMuted,
  },
  
  // Business Summary (kept for fallback)
  businessSummaryCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  businessSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  businessMetric: {
    alignItems: 'center',
    flex: 1,
  },
  businessMetricValue: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '700',
  },
  businessMetricLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  businessMetricDivider: {
    width: 1,
    backgroundColor: colors.light.border,
  },

  // Recent Orders
  recentOrdersCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentOrdersTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  seeAllLink: {
    ...typography.caption,
    color: colors.light.primary,
    fontWeight: '600',
  },
  recentOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderLight,
  },
  recentOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  recentOrderRight: {
    alignItems: 'flex-end',
  },
  recentOrderPrice: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '600',
  },
  recentOrderStatus: {
    ...typography.caption,
    fontWeight: '500',
  },
  contextCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  contextCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contextCardTitle: {
    ...typography.label,
    color: colors.light.text,
    fontWeight: '700',
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderLight,
  },
  contextRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  contextRowLabel: {
    ...typography.caption,
    color: colors.light.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  contextRowValue: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
});
