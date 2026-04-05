import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency } from '../../utils';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  remainingAmount: number;
  isLoading?: boolean;
  error?: string;
}

export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  remainingAmount,
  isLoading = false,
  error = '',
}: PaymentModalProps) {
  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [localError, setLocalError] = useState('');

  const handleConfirm = () => {
    Keyboard.dismiss();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setLocalError('Veuillez entrer un montant valide');
      return;
    }

    if (numAmount > remainingAmount) {
      setLocalError(`Le montant ne peut pas dépasser ${formatCurrency(remainingAmount)}`);
      return;
    }

    setLocalError('');
    onConfirm(numAmount);
  };

  const handleClose = () => {
    setAmount(remainingAmount.toFixed(2));
    setLocalError('');
    onClose();
  };

  const displayError = error || localError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Encaisser un paiement</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Remaining amount info */}
            <View style={styles.remainingInfo}>
              <Text style={styles.remainingLabel}>Reste à payer</Text>
              <Text style={styles.remainingValue}>{formatCurrency(remainingAmount)}</Text>
            </View>

            {/* Amount input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Montant à encaisser</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text.replace(/[^0-9.]/g, ''));
                    setLocalError('');
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.light.textMuted}
                  editable={!isLoading}
                />
                <Text style={styles.inputCurrency}>MAD</Text>
              </View>
              {displayError ? (
                <Text style={styles.inputError}>{displayError}</Text>
              ) : null}
            </View>

            {/* Quick amount buttons */}
            <View style={styles.quickAmounts}>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setAmount(remainingAmount.toFixed(2))}
                disabled={isLoading}
              >
                <Text style={styles.quickAmountText}>Tout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setAmount((remainingAmount / 2).toFixed(2))}
                disabled={isLoading}
              >
                <Text style={styles.quickAmountText}>50%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setAmount('100')}
                disabled={isLoading}
              >
                <Text style={styles.quickAmountText}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAmountButton}
                onPress={() => setAmount('200')}
                disabled={isLoading}
              >
                <Text style={styles.quickAmountText}>200</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <Text style={styles.confirmButtonText}>Encaisser</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.light.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  title: {
    ...typography.h4,
    color: colors.light.text,
  },
  body: {
    padding: spacing.lg,
  },
  remainingInfo: {
    backgroundColor: '#fef3c7',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  remainingLabel: {
    ...typography.body,
    color: '#92400e',
  },
  remainingValue: {
    ...typography.h4,
    color: '#92400e',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  input: {
    flex: 1,
    ...typography.h3,
    color: colors.light.text,
    padding: spacing.md,
    textAlign: 'right',
  },
  inputCurrency: {
    ...typography.label,
    color: colors.light.textSecondary,
    paddingRight: spacing.md,
  },
  inputError: {
    ...typography.caption,
    color: colors.light.error,
    marginTop: spacing.xs,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: colors.light.surfaceSecondary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  quickAmountText: {
    ...typography.label,
    color: colors.light.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
  },
  cancelButtonText: {
    ...typography.label,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primary,
    gap: spacing.xs,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
});
