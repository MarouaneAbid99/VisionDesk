import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stockService, suppliersService } from '../../services';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useToast } from '../../contexts';
import { Frame, Supplier } from '../../types';

type RouteParams = { frameId?: string };

export function FrameFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  const frameId = route.params?.frameId;
  const isEdit = !!frameId;

  // Form state
  const [reference, setReference] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  // Load existing frame data for edit
  const { data: existingFrame } = useQuery({
    queryKey: ['frame', frameId],
    queryFn: () => stockService.getFrameById(frameId!),
    enabled: isEdit,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'picker'],
    queryFn: () => suppliersService.getAll({ limit: 100 }),
  });

  useEffect(() => {
    if (existingFrame) {
      setReference(existingFrame.reference);
      setModel(existingFrame.model || '');
      setColor(existingFrame.color || '');
      setSize(existingFrame.size || '');
      setMaterial(existingFrame.material || '');
      setPurchasePrice(existingFrame.purchasePrice.toString());
      setSalePrice(existingFrame.salePrice.toString());
      setQuantity(existingFrame.quantity.toString());
      setReorderLevel(existingFrame.reorderLevel.toString());
      setSupplierId(existingFrame.supplierId || null);
    }
  }, [existingFrame]);

  const createMutation = useMutation({
    mutationFn: stockService.createFrame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      showSuccess('Monture ajoutée');
      navigation.goBack();
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stockService.updateFrame(frameId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      queryClient.invalidateQueries({ queryKey: ['frame', frameId] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      showSuccess('Monture mise à jour');
      navigation.goBack();
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleSubmit = () => {
    if (!reference.trim()) {
      showError('La référence est obligatoire');
      return;
    }
    if (!salePrice || parseFloat(salePrice) <= 0) {
      showError('Le prix de vente est obligatoire');
      return;
    }

    const data = {
      reference: reference.trim(),
      model: model.trim() || undefined,
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      material: material.trim() || undefined,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice),
      quantity: parseInt(quantity) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      supplierId: supplierId || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedSupplier = suppliersData?.items?.find((s) => s.id === supplierId) || null;
  const renderSupplier = ({ item }: { item: Supplier }) => {
    const isSelected = item.id === supplierId;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.supplierRow,
          isSelected && styles.supplierRowSelected,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => {
          setSupplierId(item.id);
          setShowSupplierPicker(false);
        }}
      >
        <View style={styles.supplierRowLeft}>
          <Text style={[styles.supplierName, isSelected && { color: colors.light.primary }]}>{item.name}</Text>
          <Text style={styles.supplierMeta}>{item.phone || item.email || '—'}</Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.light.primary} />}
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="glasses" size={28} color="#d97706" />
          </View>
          <Text style={styles.title}>{isEdit ? 'Modifier monture' : 'Nouvelle monture'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fournisseur</Text>
            <Pressable
              style={({ pressed }) => [styles.input, styles.supplierPicker, pressed && styles.buttonPressed]}
              onPress={() => setShowSupplierPicker(true)}
            >
              <Text style={selectedSupplier ? styles.supplierValue : styles.supplierPlaceholder}>
                {selectedSupplier?.name || 'Sélectionner un fournisseur'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.light.textMuted} />
            </Pressable>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Référence *</Text>
            <TextInput style={styles.input} value={reference} onChangeText={setReference} placeholder="REF-001" placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Modèle</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Nom du modèle" placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Couleur</Text>
              <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Noir" placeholderTextColor={colors.light.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Taille</Text>
              <TextInput style={styles.input} value={size} onChangeText={setSize} placeholder="52-18-140" placeholderTextColor={colors.light.textMuted} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Matériau</Text>
            <TextInput style={styles.input} value={material} onChangeText={setMaterial} placeholder="Acétate, Métal..." placeholderTextColor={colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Prix d'achat</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput style={styles.priceInput} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0" placeholderTextColor={colors.light.textMuted} keyboardType="decimal-pad" />
                <Text style={styles.currency}>MAD</Text>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Prix de vente *</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput style={styles.priceInput} value={salePrice} onChangeText={setSalePrice} placeholder="0" placeholderTextColor={colors.light.textMuted} keyboardType="decimal-pad" />
                <Text style={styles.currency}>MAD</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Quantité</Text>
              <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" placeholderTextColor={colors.light.textMuted} keyboardType="number-pad" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Seuil d'alerte</Text>
              <TextInput style={styles.input} value={reorderLevel} onChangeText={setReorderLevel} placeholder="5" placeholderTextColor={colors.light.textMuted} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.button, styles.submitButton, isPending && styles.buttonDisabled, pressed && !isPending && styles.submitButtonPressed]} onPress={handleSubmit} disabled={isPending}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>{isPending ? 'Enregistrement...' : 'Enregistrer'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showSupplierPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSupplierPicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un fournisseur</Text>
            <Pressable onPress={() => setShowSupplierPicker(false)}>
              <Ionicons name="close" size={22} color={colors.light.text} />
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.clearSupplierButton, pressed && { opacity: 0.8 }]}
            onPress={() => {
              setSupplierId(null);
              setShowSupplierPicker(false);
            }}
          >
            <Text style={styles.clearSupplierText}>Aucun fournisseur</Text>
          </Pressable>
          <FlatList
            data={suppliersData?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={renderSupplier}
            contentContainerStyle={{ padding: spacing.md }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  headerIcon: { width: 64, height: 64, borderRadius: borderRadius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.light.text },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.light.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase' },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.light.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 16, color: colors.light.text },
  row: { flexDirection: 'row', gap: spacing.md },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md },
  priceInput: { flex: 1, paddingVertical: spacing.md, fontSize: 18, fontWeight: '600', color: colors.light.text },
  currency: { ...typography.label, color: colors.light.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  cancelButton: { backgroundColor: colors.light.surfaceSecondary },
  cancelButtonText: { ...typography.label, color: colors.light.textSecondary },
  submitButton: { backgroundColor: colors.light.primary, ...shadows.sm },
  submitButtonText: { ...typography.label, color: '#fff', fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8 },
  submitButtonPressed: { backgroundColor: '#4338ca' },
  supplierPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplierValue: { ...typography.body, color: colors.light.text },
  supplierPlaceholder: { ...typography.body, color: colors.light.textMuted },
  modalContainer: { flex: 1, backgroundColor: colors.light.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  modalTitle: { ...typography.h4, color: colors.light.text },
  clearSupplierButton: {
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.light.surface,
  },
  clearSupplierText: { ...typography.label, color: colors.light.textSecondary },
  supplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  supplierRowSelected: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primaryBg,
  },
  supplierRowLeft: { flex: 1, marginRight: spacing.sm },
  supplierName: { ...typography.label, color: colors.light.text, fontWeight: '600' },
  supplierMeta: { ...typography.caption, color: colors.light.textMuted, marginTop: 2 },
});
