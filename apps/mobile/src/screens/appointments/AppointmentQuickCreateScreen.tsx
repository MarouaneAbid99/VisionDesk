import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsService, clientsService } from '../../services';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Client } from '../../types';
import { MainStackScreenProps } from '../../navigation/types';

type RouteProps = MainStackScreenProps<'AppointmentQuickCreate'>['route'];

const APPOINTMENT_TYPES = [
  { value: 'EYE_EXAM', label: 'Examen de vue', icon: 'eye-outline' },
  { value: 'CONTACT_LENS', label: 'Lentilles', icon: 'disc-outline' },
  { value: 'PICKUP', label: 'Retrait', icon: 'bag-check-outline' },
  { value: 'REPAIR', label: 'Réparation', icon: 'construct-outline' },
  { value: 'OTHER', label: 'Autre', icon: 'ellipsis-horizontal-outline' },
] as const;

export function AppointmentQuickCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [appointmentType, setAppointmentType] = useState<typeof APPOINTMENT_TYPES[number]['value']>('EYE_EXAM');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('09:00');

  const { data: clientsData } = useQuery({
    queryKey: ['clients', { search: clientSearch }],
    queryFn: () => clientsService.getAll({ search: clientSearch, limit: 20 }),
    enabled: showClientPicker,
  });

  const { data: preselectedClient } = useQuery({
    queryKey: ['client', route.params?.clientId],
    queryFn: () => clientsService.getById(route.params!.clientId!),
    enabled: !!route.params?.clientId && !selectedClient,
  });

  // Set preselected client when data loads
  React.useEffect(() => {
    if (preselectedClient && !selectedClient) {
      setSelectedClient(preselectedClient);
    }
  }, [preselectedClient, selectedClient]);

  const createMutation = useMutation({
    mutationFn: appointmentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      Alert.alert(
        'RDV créé',
        'Le rendez-vous a été planifié.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de créer le rendez-vous'
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedClient) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    createMutation.mutate({
      clientId: selectedClient.id,
      appointmentType,
      scheduledAt,
      durationMinutes: 30,
    });
  };

  const isValid = selectedClient && date && time;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="calendar" size={48} color={colors.light.primary} />
          <Text style={styles.title}>Nouveau RDV</Text>
          <Text style={styles.subtitle}>Planification rapide</Text>
        </View>

        <View style={styles.form}>
          {/* Client Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client *</Text>
            <TouchableOpacity
              style={styles.clientSelector}
              onPress={() => setShowClientPicker(true)}
            >
              {selectedClient ? (
                <View style={styles.selectedClient}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                    </Text>
                  </View>
                  <Text style={styles.clientName}>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Sélectionner un client</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Appointment Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de RDV</Text>
            <View style={styles.typeGrid}>
              {APPOINTMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    appointmentType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setAppointmentType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={appointmentType === type.value ? '#fff' : colors.light.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      appointmentType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.light.textMuted} />
              <TextInput
                style={styles.inputInner}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.light.textMuted}
              />
            </View>
          </View>

          {/* Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Heure *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="time-outline" size={20} color={colors.light.textMuted} />
              <TextInput
                style={styles.inputInner}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.light.textMuted}
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              (!isValid || createMutation.isPending) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Text style={styles.submitButtonText}>Création...</Text>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Créer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un client</Text>
            <TouchableOpacity onPress={() => setShowClientPicker(false)}>
              <Ionicons name="close" size={24} color={colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search" size={20} color={colors.light.textMuted} />
            <TextInput
              style={styles.modalSearchInput}
              value={clientSearch}
              onChangeText={setClientSearch}
              placeholder="Rechercher..."
              placeholderTextColor={colors.light.textMuted}
              autoFocus
            />
          </View>

          <FlatList
            data={clientsData?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clientItem}
                onPress={() => {
                  setSelectedClient(item);
                  setShowClientPicker(false);
                }}
              >
                <View style={styles.clientItemAvatar}>
                  <Text style={styles.clientItemAvatarText}>
                    {item.firstName[0]}{item.lastName[0]}
                  </Text>
                </View>
                <View style={styles.clientItemInfo}>
                  <Text style={styles.clientItemName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.phone && (
                    <Text style={styles.clientItemPhone}>{item.phone}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.clientList}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.light.text,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectedClient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  clientAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  clientName: {
    ...typography.body,
    color: colors.light.text,
    fontWeight: '500',
  },
  placeholderText: {
    ...typography.body,
    color: colors.light.textMuted,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.surfaceSecondary,
    gap: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: colors.light.primary,
  },
  typeButtonText: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.light.surfaceSecondary,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.light.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.light.primary,
  },
  submitButtonText: {
    ...typography.label,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.light.text,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  clientList: {
    padding: spacing.md,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  clientItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  clientItemAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  clientItemInfo: {
    flex: 1,
  },
  clientItemName: {
    ...typography.label,
    color: colors.light.text,
  },
  clientItemPhone: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
  },
});
