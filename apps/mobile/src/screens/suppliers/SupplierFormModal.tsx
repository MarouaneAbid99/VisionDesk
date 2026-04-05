import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Supplier } from '../../types';

interface SupplierFormModalProps {
  visible: boolean;
  title: string;
  initialSupplier?: Supplier | null;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => void;
}

export function SupplierFormModal({
  visible,
  title,
  initialSupplier,
  isSaving,
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialSupplier?.name || '');
      setContact(initialSupplier?.contact || '');
      setEmail(initialSupplier?.email || '');
      setPhone(initialSupplier?.phone || '');
      setAddress(initialSupplier?.address || '');
      setNotes(initialSupplier?.notes || '');
    }
  }, [visible, initialSupplier]);

  const canSubmit = useMemo(() => name.trim().length > 0 && !isSaving, [name, isSaving]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.light.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.group}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom fournisseur" placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Contact</Text>
            <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="Nom du contact" placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+212..." placeholderTextColor={colors.light.textMuted} keyboardType="phone-pad" />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="contact@..." placeholderTextColor={colors.light.textMuted} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes fournisseur"
              placeholderTextColor={colors.light.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.button, styles.cancelBtn, pressed && { opacity: 0.85 }]} onPress={onClose} disabled={!!isSaving}>
            <Text style={styles.cancelTxt}>Annuler</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, styles.submitBtn, (!canSubmit || isSaving) && styles.disabledBtn, pressed && canSubmit && { opacity: 0.9 }]}
            disabled={!canSubmit || !!isSaving}
            onPress={() =>
              onSubmit({
                name: name.trim(),
                contact: contact.trim() || undefined,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Enregistrer</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    backgroundColor: colors.light.surface,
  },
  title: { ...typography.h4, color: colors.light.text },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  group: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.light.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.light.text,
    fontSize: 16,
  },
  notesInput: { minHeight: 90 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.light.border },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md },
  cancelBtn: { backgroundColor: colors.light.surfaceSecondary },
  submitBtn: { backgroundColor: colors.light.primary },
  disabledBtn: { opacity: 0.5 },
  cancelTxt: { ...typography.label, color: colors.light.textSecondary },
  submitTxt: { ...typography.label, color: '#fff', fontWeight: '700' },
});
