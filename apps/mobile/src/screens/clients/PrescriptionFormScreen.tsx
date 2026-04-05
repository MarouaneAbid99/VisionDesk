import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { prescriptionsService, CreatePrescriptionInput } from '../../services';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  normalizeOpticalDecimalString,
  parseOptionalAxis,
  parseOptionalDecimal,
  parseOptionalPd,
} from '../../utils/opticalInput';

type RxTextFields =
  | 'odSph'
  | 'odCyl'
  | 'odAxis'
  | 'odAdd'
  | 'osSph'
  | 'osCyl'
  | 'osAxis'
  | 'osAdd'
  | 'pdFar'
  | 'pdNear';

const initialText: Record<RxTextFields, string> = {
  odSph: '',
  odCyl: '',
  odAxis: '',
  odAdd: '',
  osSph: '',
  osCyl: '',
  osAxis: '',
  osAdd: '',
  pdFar: '',
  pdNear: '',
};

const OPTICAL_BLUR_FIELDS: RxTextFields[] = [
  'odSph',
  'odCyl',
  'odAdd',
  'osSph',
  'osCyl',
  'osAdd',
];

function extractApiMessage(err: unknown): string {
  const ax = err as AxiosError<{
    error?: { message?: string; details?: { field: string; message: string }[] };
  }>;
  const e = ax.response?.data?.error;
  if (ax.response?.status === 400 && e?.details?.length) {
    return e.details.map((d) => `${d.field}: ${d.message}`).join('\n');
  }
  if (e?.message) return e.message;
  return ax.message || 'Erreur réseau ou serveur';
}

export function PrescriptionFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { clientId } = route.params;

  const [text, setText] = useState<Record<RxTextFields, string>>(initialText);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RxTextFields | 'submit', string>>>({});
  const [formExtras, setFormExtras] = useState<{ doctorName: string | null; notes: string | null }>({
    doctorName: null,
    notes: null,
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePrescriptionInput) => prescriptionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      Alert.alert('Succès', 'Ordonnance enregistrée', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (err: unknown) => {
      Alert.alert('Erreur', extractApiMessage(err));
    },
  });

  const clearFieldError = useCallback((field: RxTextFields) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleDecimalChange = (field: RxTextFields, value: string) => {
    clearFieldError(field);
    setText((prev) => ({ ...prev, [field]: value }));
  };

  const handleDecimalBlur = (field: RxTextFields) => {
    if (!OPTICAL_BLUR_FIELDS.includes(field)) return;
    setText((prev) => {
      const next = normalizeOpticalDecimalString(prev[field] || '');
      if (next === (prev[field] || '')) return prev;
      return { ...prev, [field]: next };
    });
  };

  const buildPayload = (): CreatePrescriptionInput | null => {
    const err: Partial<Record<RxTextFields, string>> = {};

    const odSph = parseOptionalDecimal(text.odSph, { min: -25, max: 25 });
    if (!odSph.ok) err.odSph = odSph.error;
    const odCyl = parseOptionalDecimal(text.odCyl, { min: -10, max: 10 });
    if (!odCyl.ok) err.odCyl = odCyl.error;
    const odAxis = parseOptionalAxis(text.odAxis);
    if (!odAxis.ok) err.odAxis = odAxis.error;
    const odAdd = parseOptionalDecimal(text.odAdd, { min: 0, max: 4 });
    if (!odAdd.ok) err.odAdd = odAdd.error;

    const osSph = parseOptionalDecimal(text.osSph, { min: -25, max: 25 });
    if (!osSph.ok) err.osSph = osSph.error;
    const osCyl = parseOptionalDecimal(text.osCyl, { min: -10, max: 10 });
    if (!osCyl.ok) err.osCyl = osCyl.error;
    const osAxis = parseOptionalAxis(text.osAxis);
    if (!osAxis.ok) err.osAxis = osAxis.error;
    const osAdd = parseOptionalDecimal(text.osAdd, { min: 0, max: 4 });
    if (!osAdd.ok) err.osAdd = osAdd.error;

    const pdFar = parseOptionalPd(text.pdFar);
    if (!pdFar.ok) err.pdFar = pdFar.error;
    const pdNear = parseOptionalPd(text.pdNear);
    if (!pdNear.ok) err.pdNear = pdNear.error;

    if (Object.keys(err).length) {
      setFieldErrors(err);
      return null;
    }

    return {
      clientId,
      odSph: odSph.ok ? odSph.value : null,
      odCyl: odCyl.ok ? odCyl.value : null,
      odAxis: odAxis.ok ? odAxis.value : null,
      odAdd: odAdd.ok ? odAdd.value : null,
      osSph: osSph.ok ? osSph.value : null,
      osCyl: osCyl.ok ? osCyl.value : null,
      osAxis: osAxis.ok ? osAxis.value : null,
      osAdd: osAdd.ok ? osAdd.value : null,
      pdFar: pdFar.ok ? pdFar.value : null,
      pdNear: pdNear.ok ? pdNear.value : null,
      doctorName: null,
      notes: null,
    };
  };

  const updateTextField = (field: 'doctorName' | 'notes', value: string) => {
    setFormExtras((prev) => ({ ...prev, [field]: value || null }));
  };

  const inputFor = (
    field: RxTextFields,
    label: string,
    placeholder: string,
    keyboard: 'decimal' | 'numeric' = 'decimal'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, fieldErrors[field] ? styles.inputError : null]}
        placeholder={placeholder}
        keyboardType={keyboard === 'decimal' ? 'numbers-and-punctuation' : 'numeric'}
        value={text[field]}
        onChangeText={(v) => handleDecimalChange(field, v)}
        onBlur={() => {
          if (field !== 'odAxis' && field !== 'osAxis') handleDecimalBlur(field);
        }}
      />
      {fieldErrors[field] ? <Text style={styles.inlineError}>{fieldErrors[field]}</Text> : null}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.eyeIcon, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.eyeIconText, { color: '#2563eb' }]}>OD</Text>
          </View>
          <Text style={styles.sectionTitle}>Œil Droit</Text>
        </View>
        <View style={styles.grid}>
          {inputFor('odSph', 'Sphère', '-3.00')}
          {inputFor('odCyl', 'Cylindre', '-1.50')}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Axe</Text>
            <TextInput
              style={[styles.input, fieldErrors.odAxis ? styles.inputError : null]}
              placeholder="90"
              keyboardType="numeric"
              value={text.odAxis}
              onChangeText={(v) => handleDecimalChange('odAxis', v)}
            />
            {fieldErrors.odAxis ? <Text style={styles.inlineError}>{fieldErrors.odAxis}</Text> : null}
          </View>
          {inputFor('odAdd', 'Addition', '2.00')}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.eyeIcon, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.eyeIconText, { color: '#16a34a' }]}>OS</Text>
          </View>
          <Text style={styles.sectionTitle}>Œil Gauche</Text>
        </View>
        <View style={styles.grid}>
          {inputFor('osSph', 'Sphère', '-2.75')}
          {inputFor('osCyl', 'Cylindre', '-1.25')}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Axe</Text>
            <TextInput
              style={[styles.input, fieldErrors.osAxis ? styles.inputError : null]}
              placeholder="85"
              keyboardType="numeric"
              value={text.osAxis}
              onChangeText={(v) => handleDecimalChange('osAxis', v)}
            />
            {fieldErrors.osAxis ? <Text style={styles.inlineError}>{fieldErrors.osAxis}</Text> : null}
          </View>
          {inputFor('osAdd', 'Addition', '2.00')}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Écart Pupillaire</Text>
        <View style={styles.grid}>
          {inputFor('pdFar', 'EP Loin (mm)', '63', 'numeric')}
          {inputFor('pdNear', 'EP Près (mm)', '60', 'numeric')}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Médecin</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Nom"
            value={formExtras.doctorName ?? ''}
            onChangeText={(v) => updateTextField('doctorName', v)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes additionnelles..."
            multiline
            numberOfLines={3}
            value={formExtras.notes ?? ''}
            onChangeText={(v) => updateTextField('notes', v)}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]}
        onPress={() => {
          const payload = buildPayload();
          if (!payload) return;
          mutation.mutate({
            ...payload,
            doctorName: formExtras.doctorName,
            notes: formExtras.notes,
          });
        }}
        disabled={mutation.isPending}
      >
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>{mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  eyeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    ...typography.label,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.light.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inputGroup: {
    width: '48%',
    flexGrow: 1,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.light.text,
  },
  inputError: {
    borderColor: colors.light.error,
  },
  inlineError: {
    ...typography.caption,
    color: colors.light.error,
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.label,
    color: '#fff',
  },
});
