import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { stockService, suppliersService } from '../../services';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useToast } from '../../contexts';
import { LensType, LensCoating, Supplier } from '../../types';

type RouteParams = { lensId?: string };

const LENS_TYPES: { value: LensType; label: string }[] = [
  { value: 'SINGLE_VISION', label: 'Unifocaux' },
  { value: 'BIFOCAL', label: 'Bifocaux' },
  { value: 'PROGRESSIVE', label: 'Progressifs' },
  { value: 'READING', label: 'Lecture' },
];

const COATINGS: { value: LensCoating; label: string }[] = [
  { value: 'NONE', label: 'Aucun' },
  { value: 'ANTI_REFLECTIVE', label: 'Anti-reflet' },
  { value: 'BLUE_LIGHT', label: 'Lumière bleue' },
  { value: 'PHOTOCHROMIC', label: 'Photochromique' },
];

export function LensFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  const lensId = route.params?.lensId;
  const isEdit = !!lensId;

  const [name, setName] = useState('');
  const [lensType, setLensType] = useState<LensType>('SINGLE_VISION');
  const [index, setIndex] = useState('');
  const [coating, setCoating] = useState<LensCoating>('NONE');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const { data: existingLens } = useQuery({
    queryKey: ['lens', lensId],
    queryFn: () => stockService.getLensById(lensId!),
    enabled: isEdit,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'picker'],
    queryFn: () => suppliersService.getAll({ limit: 100 }),
  });

  useEffect(() => {
    if (existingLens) {
      setName(existingLens.name);
      setLensType(existingLens.lensType);
      setIndex(existingLens.index || '');
      setCoating(existingLens.coating);
      setPurchasePrice(existingLens.purchasePrice.toString());
      setSalePrice(existingLens.salePrice.toString());
      setQuantity(existingLens.quantity.toString());
      setReorderLevel(existingLens.reorderLevel.toString());
      setSupplierId(existingLens.supplierId || null);
    }
  }, [existingLens]);

  const createMutation = useMutation({
    mutationFn: stockService.createLens,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      showSuccess('Verre ajouté');
      navigation.goBack();
    },
    onError: (error: any) => showError(error.response?.data?.message || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stockService.updateLens(lensId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      queryClient.invalidateQueries({ queryKey: ['lens', lensId] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      showSuccess('Verre mis à jour');
      navigation.goBack();
    },
    onError: (error: any) => showError(error.response?.data?.message || 'Erreur'),
  });

  const handleSubmit = () => {
    if (!name.trim()) { showError('Le nom est obligatoire'); return; }
    if (!salePrice || parseFloat(salePrice) <= 0) { showError('Le prix de vente est obligatoire'); return; }

    const data = {
      name: name.trim(),
      lensType,
      index: index.trim() || undefined,
      coating,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice),
      quantity: parseInt(quantity) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      supplierId: supplierId || undefined,
    };

    isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
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
          <View style={[styles.headerIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="eye" size={28} color="#2563eb" />
          </View>
          <Text style={styles.title}>{isEdit ? 'Modifier verre' : 'Nouveau verre'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fournisseur</Text>
            <Pressable
              style={({ pressed }) => [styles.input, styles.supplierPicker, pressed && { opacity: 0.85 }]}
              onPress={() => setShowSupplierPicker(true)}
            >
              <Text style={selectedSupplier ? styles.supplierValue : styles.supplierPlaceholder}>
                {selectedSupplier?.name || 'Sélectionner un fournisseur'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.light.textMuted} />
            </Pressable>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Essilor Crizal..." placeholderTextColor={colors.light.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.chipRow}>
              {LENS_TYPES.map((t) => (
                <Pressable key={t.value} style={[styles.chip, lensType === t.value && styles.chipActive]} onPress={() => setLensType(t.value)}>
                  <Text style={[styles.chipText, lensType === t.value && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Traitement</Text>
            <View style={styles.chipRow}>
              {COATINGS.map((c) => (
                <Pressable key={c.value} style={[styles.chip, coating === c.value && styles.chipActive]} onPress={() => setCoating(c.value)}>
                  <Text style={[styles.chipText, coating === c.value && styles.chipTextActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Indice</Text>
            <TextInput style={styles.input} value={index} onChangeText={setIndex} placeholder="1.5, 1.6, 1.67..." placeholderTextColor={colors.light.textMuted} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Prix d'achat</Text>
              <View style={styles.priceWrapper}>
                <TextInput style={styles.priceInput} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0" keyboardType="decimal-pad" placeholderTextColor={colors.light.textMuted} />
                <Text style={styles.currency}>MAD</Text>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Prix de vente *</Text>
              <View style={styles.priceWrapper}>
                <TextInput style={styles.priceInput} value={salePrice} onChangeText={setSalePrice} placeholder="0" keyboardType="decimal-pad" placeholderTextColor={colors.light.textMuted} />
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
              <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="number-pad" placeholderTextColor={colors.light.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Seuil d'alerte</Text>
              <TextInput style={styles.input} value={reorderLevel} onChangeText={setReorderLevel} placeholder="5" keyboardType="number-pad" placeholderTextColor={colors.light.textMuted} />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.button, styles.cancelButton, pressed && { opacity: 0.8 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.button, styles.submitButton, isPending && { opacity: 0.5 }, pressed && !isPending && { backgroundColor: '#4338ca' }]} onPress={handleSubmit} disabled={isPending}>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.light.surfaceSecondary, borderWidth: 1, borderColor: colors.light.border },
  chipActive: { backgroundColor: colors.light.primaryBg, borderColor: colors.light.primary },
  chipText: { ...typography.caption, color: colors.light.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.light.primary },
  priceWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md },
  priceInput: { flex: 1, paddingVertical: spacing.md, fontSize: 18, fontWeight: '600', color: colors.light.text },
  currency: { ...typography.label, color: colors.light.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  cancelButton: { backgroundColor: colors.light.surfaceSecondary },
  cancelButtonText: { ...typography.label, color: colors.light.textSecondary },
  submitButton: { backgroundColor: colors.light.primary, ...shadows.sm },
  submitButtonText: { ...typography.label, color: '#fff', fontWeight: '600' },
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
