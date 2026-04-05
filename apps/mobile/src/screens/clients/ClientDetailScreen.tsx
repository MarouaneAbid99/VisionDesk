import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { clientsService, appointmentsService } from '../../services';
import { Card, StatusBadge, LoadingScreen } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatDate, formatCurrency, getFullName } from '../../utils';
import { MainStackScreenProps } from '../../navigation/types';
import { Appointment, AppointmentType, AppointmentStatus } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

const appointmentTypeLabels: Record<AppointmentType, string> = {
  EYE_EXAM: 'Examen',
  CONTACT_LENS: 'Lentilles',
  PICKUP: 'Retrait',
  REPAIR: 'Réparation',
  OTHER: 'Autre',
};

const appointmentStatusColors: Record<AppointmentStatus, { bg: string; text: string }> = {
  SCHEDULED: { bg: '#dbeafe', text: '#2563eb' },
  CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
  COMPLETED: { bg: '#f1f5f9', text: '#64748b' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};

type RouteProps = MainStackScreenProps<'ClientDetail'>['route'];

export function ClientDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { id } = route.params;

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['client-appointments', id],
    queryFn: () => appointmentsService.getAll({ clientId: id, limit: 5 }),
    enabled: !!id,
  });

  const handleCall = () => {
    if (client?.phone) {
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Client non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.name}>{getFullName(client.firstName, client.lastName)}</Text>
        {client.address && <Text style={styles.city}>{client.address}</Text>}
      </View>

      <View style={styles.actions}>
        {client.phone && (
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]} 
            onPress={handleCall}
          >
            <Ionicons name="call" size={24} color={colors.light.primary} />
            <Text style={styles.actionText}>Appeler</Text>
          </Pressable>
        )}
        {client.email && (
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]} 
            onPress={handleEmail}
          >
            <Ionicons name="mail" size={24} color={colors.light.primary} />
            <Text style={styles.actionText}>Email</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Card>
          {client.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.light.textSecondary} />
              <Text style={styles.infoText}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.light.textSecondary} />
              <Text style={styles.infoText}>{client.email}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.light.textSecondary} />
              <Text style={styles.infoText}>{client.address}</Text>
            </View>
          )}
          {client.notes && (
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.light.textSecondary} />
              <Text style={styles.infoText}>{client.notes}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.light.textSecondary} />
            <Text style={styles.infoText}>Client depuis {formatDate(client.createdAt)}</Text>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ordonnances</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => navigation.navigate('PrescriptionForm', { clientId: id })}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </Pressable>
        </View>
        {client.prescriptions && client.prescriptions.length > 0 ? (
          client.prescriptions.map((rx) => (
            <Card key={rx.id} style={styles.prescriptionCard}>
              <View style={styles.rxHeader}>
                <Text style={styles.rxDate}>{formatDate(rx.createdAt)}</Text>
              </View>
              <View style={styles.rxGrid}>
                <View style={styles.rxEye}>
                  <Text style={styles.rxEyeLabel}>OD (Droit)</Text>
                  <Text style={styles.rxValue}>
                    Sph: {rx.odSph ?? '—'} | Cyl: {rx.odCyl ?? '—'} | Axe: {rx.odAxis ?? '—'}
                  </Text>
                  {rx.odAdd && <Text style={styles.rxValue}>Add: {rx.odAdd}</Text>}
                </View>
                <View style={styles.rxEye}>
                  <Text style={styles.rxEyeLabel}>OS (Gauche)</Text>
                  <Text style={styles.rxValue}>
                    Sph: {rx.osSph ?? '—'} | Cyl: {rx.osCyl ?? '—'} | Axe: {rx.osAxis ?? '—'}
                  </Text>
                  {rx.osAdd && <Text style={styles.rxValue}>Add: {rx.osAdd}</Text>}
                </View>
              </View>
              {rx.pdFar && <Text style={styles.rxPd}>EP: {rx.pdFar} mm</Text>}
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune ordonnance</Text>
        )}
      </View>

      {client.orders && client.orders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          {client.orders.slice(0, 5).map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <StatusBadge status={order.status} type="order" size="sm" />
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                <Text style={styles.orderPrice}>{formatCurrency(order.totalPrice)}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {appointmentsData?.appointments && appointmentsData.appointments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous</Text>
          {appointmentsData.appointments.map((apt: Appointment) => (
            <Card key={apt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={[styles.appointmentTypeBadge, { backgroundColor: appointmentStatusColors[apt.status].bg }]}>
                  <Text style={[styles.appointmentTypeBadgeText, { color: appointmentStatusColors[apt.status].text }]}>
                    {apt.status}
                  </Text>
                </View>
                <Text style={styles.appointmentType}>
                  {appointmentTypeLabels[apt.appointmentType]}
                </Text>
              </View>
              <View style={styles.appointmentDateTime}>
                <View style={styles.appointmentDateTimeItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.light.textSecondary} />
                  <Text style={styles.appointmentDateTimeText}>{formatDate(apt.scheduledAt)}</Text>
                </View>
                <View style={styles.appointmentDateTimeItem}>
                  <Ionicons name="time-outline" size={14} color={colors.light.textSecondary} />
                  <Text style={styles.appointmentDateTimeText}>
                    {new Date(apt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.appointmentDuration}>{apt.durationMinutes} min</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.light.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
  },
  name: {
    ...typography.h3,
    color: colors.light.text,
  },
  city: {
    ...typography.body,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  actionText: {
    ...typography.caption,
    color: colors.light.primary,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.light.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  addButtonText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.light.textMuted,
    textAlign: 'center',
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  infoText: {
    ...typography.body,
    color: colors.light.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  prescriptionCard: {
    marginBottom: spacing.sm,
  },
  rxHeader: {
    marginBottom: spacing.sm,
  },
  rxDate: {
    ...typography.label,
    color: colors.light.text,
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
  rxPd: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginTop: spacing.sm,
  },
  orderCard: {
    marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNumber: {
    ...typography.label,
    color: colors.light.text,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
  orderPrice: {
    ...typography.label,
    color: colors.light.text,
  },
  errorText: {
    ...typography.body,
    color: colors.light.error,
    textAlign: 'center',
    padding: spacing.xl,
  },
  appointmentCard: {
    marginBottom: spacing.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  appointmentTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  appointmentTypeBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  appointmentType: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appointmentDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  appointmentDateTimeText: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  appointmentDuration: {
    ...typography.caption,
    color: colors.light.textMuted,
  },
});
