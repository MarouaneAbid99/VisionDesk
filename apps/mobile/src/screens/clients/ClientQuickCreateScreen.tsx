import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { clientsService } from '../../services';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useToast } from '../../contexts';

export function ClientQuickCreateScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const createMutation = useMutation({
    mutationFn: clientsService.create,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess(`${client.firstName} ${client.lastName} créé avec succès`);
      setTimeout(() => navigation.goBack(), 500);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Impossible de créer le client');
    },
  });

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      showWarning('Le prénom et le nom sont obligatoires');
      return;
    }

    createMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  const isValid = firstName.trim() && lastName.trim();

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
          <Ionicons name="person-add" size={48} color={colors.light.primary} />
          <Text style={styles.title}>Nouveau client</Text>
          <Text style={styles.subtitle}>Création rapide</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jean"
                placeholderTextColor={colors.light.textMuted}
                autoCapitalize="words"
                autoFocus
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Dupont"
                placeholderTextColor={colors.light.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="call-outline" size={20} color={colors.light.textMuted} />
              <TextInput
                style={styles.inputInner}
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
                placeholderTextColor={colors.light.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (optionnel)</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.light.textMuted} />
              <TextInput
                style={styles.inputInner}
                value={email}
                onChangeText={setEmail}
                placeholder="jean.dupont@email.com"
                placeholderTextColor={colors.light.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button, 
              styles.cancelButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.submitButton,
              (!isValid || createMutation.isPending) && styles.buttonDisabled,
              pressed && !createMutation.isPending && styles.submitButtonPressed,
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
          </Pressable>
        </View>
      </ScrollView>
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
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.light.text,
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
    ...shadows.sm,
  },
  submitButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitButtonPressed: {
    backgroundColor: '#4338ca',
    transform: [{ scale: 0.98 }],
  },
});
