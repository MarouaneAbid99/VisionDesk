import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MainStackScreenProps } from '../../navigation/types';
import { suppliersService, stockService } from '../../services';
import type { SupplierMetricsPeriod } from '../../services';
import { Card, LoadingScreen } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useToast } from '../../contexts';
import { SupplierFormModal } from './SupplierFormModal';
import { formatCurrency, formatDate } from '../../utils';

type RouteProps = MainStackScreenProps<'SupplierDetail'>['route'];

export function SupplierDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState<SupplierMetricsPeriod>('month');
  const { id } = route.params;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersService.getById(id),
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['supplier-metrics', id, metricsPeriod],
    queryFn: () => suppliersService.getBusinessMetrics(id, metricsPeriod),
  });

  const { data: stockContext, isLoading: stockLoading } = useQuery({
    queryKey: ['supplier-stock-context', id],
    queryFn: async () => {
      const [framesResult, lensesResult] = await Promise.all([
        stockService.getFrames({ supplierId: id, limit: 100 }),
        stockService.getLenses({ supplierId: id, limit: 100 }),
      ]);
      return {
        framesCount: framesResult.total,
        lensesCount: lensesResult.total,
        frames: framesResult.items,
        lenses: lensesResult.items,
        inStockUnits:
          framesResult.items.reduce((sum, i) => sum + (i.quantity || 0), 0) +
          lensesResult.items.reduce((sum, i) => sum + (i.quantity || 0), 0),
      };
    },
  });

  const totalItems = useMemo(
    () => (stockContext?.framesCount || 0) + (stockContext?.lensesCount || 0),
    [stockContext]
  );

  const updateMutation = useMutation({
    mutationFn: (payload: any) => suppliersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stock-context', id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-metrics', id] });
      showSuccess('Fournisseur mis à jour');
      setIsEditOpen(false);
    },
    onError: (error: any) => showError(error?.response?.data?.message || 'Erreur de mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => suppliersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      showSuccess('Fournisseur supprimé');
      navigation.goBack();
    },
    onError: (error: any) => showError(error?.response?.data?.message || 'Suppression impossible'),
  });

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le fournisseur',
      'Cette action est définitive. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;
  if (!supplier) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Fournisseur introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={32} color={colors.light.primary} />
        </View>
        <Text style={styles.name}>{supplier.name}</Text>
        <Text style={styles.sub}>{supplier.contact || 'Contact non renseigné'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Card>
          <InfoRow icon="call-outline" label="Téléphone" value={supplier.phone || '—'} />
          <InfoRow icon="mail-outline" label="E-mail" value={supplier.email || '—'} />
          <InfoRow icon="location-outline" label="Adresse" value={supplier.address || '—'} />
          <InfoRow icon="document-text-outline" label="Notes" value={supplier.notes || '—'} />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contexte business</Text>
        <Card>
          <View style={styles.metricsRow}>
            <Metric value={stockLoading ? '...' : String(stockContext?.framesCount || 0)} label="Montures" />
            <Metric value={stockLoading ? '...' : String(stockContext?.lensesCount || 0)} label="Verres" />
            <Metric value={stockLoading ? '...' : String(totalItems)} label="Articles liés" />
          </View>
          <View style={styles.metricsRule} />
          <View style={styles.metricsRow}>
            <Metric value={stockLoading ? '...' : String(stockContext?.inStockUnits || 0)} label="Unités en stock" />
            <Pressable
              style={({ pressed }) => [styles.stockBtn, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('SupplierStock', { supplierId: id, supplierName: supplier.name })}
            >
              <Ionicons name="cube-outline" size={16} color={colors.light.primary} />
              <Text style={styles.stockBtnText}>Voir le stock</Text>
            </Pressable>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance (commandes)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {(
            [
              ['today', "Auj."],
              ['week', '7 j.'],
              ['month', 'Mois'],
              ['year', 'Année'],
              ['all', 'Tout'],
            ] as const
          ).map(([p, label]) => (
            <Pressable
              key={p}
              style={[styles.periodChip, metricsPeriod === p && styles.periodChipActive]}
              onPress={() => setMetricsPeriod(p)}
            >
              <Text style={[styles.periodChipTxt, metricsPeriod === p && styles.periodChipTxtActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Card>
          {metricsLoading ? (
            <Text style={styles.mutedText}>Chargement des indicateurs…</Text>
          ) : metrics ? (
            <>
              <View style={styles.metricsRow}>
                <Metric value={String(metrics.ordersCount)} label="Commandes" />
                <Metric value={formatCurrency(metrics.saleValueTotal)} label="CA attribué" />
                <Metric value={formatCurrency(metrics.estimatedProfit)} label="Marge est." />
              </View>
              <View style={styles.metricsRule} />
              <View style={styles.kpiLine}>
                <Text style={styles.kpiLabel}>Coût d&apos;achat (est.)</Text>
                <Text style={styles.kpiValue}>{formatCurrency(metrics.purchaseCostEstimated)}</Text>
              </View>
              <Text style={styles.disclaimer}>{metrics.methodology.limitation}</Text>
            </>
          ) : null}
        </Card>
      </View>

      {metrics && metrics.recentSales.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventes récentes (lignes liées)</Text>
          <Card>
            {metrics.recentSales.slice(0, 8).map((sale, idx) => (
              <View key={`${sale.orderId}-${idx}`} style={styles.saleRow}>
                <View style={styles.saleLeft}>
                  <Text style={styles.saleTitle}>{sale.orderNumber}</Text>
                  <Text style={styles.saleMeta}>
                    {formatDate(sale.createdAt)}
                    {sale.clientName ? ` · ${sale.clientName}` : ''}
                  </Text>
                  {sale.parts.map((part, i) => (
                    <Text key={i} style={styles.salePart}>
                      {part.kind === 'frame' ? 'Monture' : 'Verres'} · {part.label} · {formatCurrency(part.amount)}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {metrics && metrics.recentStockMovementsIn.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrées stock récentes (sans montant d&apos;achat)</Text>
          <Card>
            {metrics.recentStockMovementsIn.map((m) => (
              <View key={m.id} style={styles.stockMvRow}>
                <Text style={styles.stockMvTitle}>
                  {m.kind === 'frame' ? 'Monture' : 'Verres'} · {m.productLabel}
                </Text>
                <Text style={styles.stockMvMeta}>
                  {formatDate(m.createdAt)} · +{m.quantity} unité(s)
                  {m.reason ? ` · ${m.reason}` : ''}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Montures liees</Text>
        <Card>
          {stockLoading ? (
            <Text style={styles.mutedText}>Chargement...</Text>
          ) : (stockContext?.frames?.length || 0) === 0 ? (
            <Text style={styles.mutedText}>Aucune monture liee a ce fournisseur.</Text>
          ) : (
            stockContext?.frames?.map((frame: any) => {
              const purchase = Number(frame.purchasePrice) || 0;
              const sale = Number(frame.salePrice) || 0;
              return (
                <View key={frame.id} style={styles.productRow}>
                  <View style={styles.productLeft}>
                    <Text style={styles.productName}>{`${frame.brand?.name || ''} ${frame.reference}`.trim()}</Text>
                    <Text style={styles.productMeta}>
                      Stock {frame.quantity} · PA {formatCurrency(purchase)} · PV {formatCurrency(sale)}
                    </Text>
                    <Text style={styles.productMargin}>Marge/unité {formatCurrency(sale - purchase)}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatCurrency(sale)}</Text>
                </View>
              );
            })
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verres lies</Text>
        <Card>
          {stockLoading ? (
            <Text style={styles.mutedText}>Chargement...</Text>
          ) : (stockContext?.lenses?.length || 0) === 0 ? (
            <Text style={styles.mutedText}>Aucun verre lie a ce fournisseur.</Text>
          ) : (
            stockContext?.lenses?.map((lens: any) => {
              const purchase = Number(lens.purchasePrice) || 0;
              const sale = Number(lens.salePrice) || 0;
              return (
                <View key={lens.id} style={styles.productRow}>
                  <View style={styles.productLeft}>
                    <Text style={styles.productName}>{lens.name}</Text>
                    <Text style={styles.productMeta}>
                      Stock {lens.quantity} · PA {formatCurrency(purchase)} · PV {formatCurrency(sale)}
                    </Text>
                    <Text style={styles.productMargin}>Marge/unité {formatCurrency(sale - purchase)}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatCurrency(sale)}</Text>
                </View>
              );
            })
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsRow}>
          <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]} onPress={() => setIsEditOpen(true)}>
            <Ionicons name="create-outline" size={18} color={colors.light.primary} />
            <Text style={styles.actionBtnTxt}>Modifier</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, (deleteMutation.isPending || updateMutation.isPending) && styles.disabled, pressed && { opacity: 0.9 }]}
            disabled={deleteMutation.isPending || updateMutation.isPending}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteBtnTxt}>{deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: spacing.xl }} />

      <SupplierFormModal
        visible={isEditOpen}
        title="Modifier fournisseur"
        initialSupplier={supplier}
        isSaving={updateMutation.isPending}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(payload) => updateMutation.mutate(payload)}
      />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color={colors.light.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.light.surface },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.light.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: { ...typography.h3, color: colors.light.text, fontWeight: '700' },
  sub: { ...typography.bodySmall, color: colors.light.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: {
    ...typography.label,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderLight,
    gap: spacing.sm,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  infoLabel: { ...typography.bodySmall, color: colors.light.textSecondary },
  infoValue: { ...typography.bodySmall, color: colors.light.text, fontWeight: '600', textAlign: 'right', flex: 1 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { ...typography.h4, color: colors.light.text, fontWeight: '800' },
  metricLabel: { ...typography.caption, color: colors.light.textMuted, marginTop: 2, textAlign: 'center' },
  metricsRule: { height: 1, backgroundColor: colors.light.borderLight, marginVertical: spacing.sm },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.light.primaryBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  stockBtnText: { ...typography.caption, color: colors.light.primary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  actionBtnTxt: { ...typography.label, color: colors.light.primary, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.light.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  deleteBtnTxt: { ...typography.label, color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  errorText: { ...typography.body, color: colors.light.error, padding: spacing.lg, textAlign: 'center' },
  mutedText: { ...typography.bodySmall, color: colors.light.textMuted },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderLight,
    gap: spacing.sm,
  },
  productLeft: { flex: 1 },
  productName: { ...typography.bodySmall, color: colors.light.text, fontWeight: '600' },
  productMeta: { ...typography.caption, color: colors.light.textMuted, marginTop: 2 },
  productPrice: { ...typography.bodySmall, color: colors.light.primary, fontWeight: '700' },
  productMargin: { ...typography.caption, color: colors.light.textSecondary, marginTop: 2 },
  periodScroll: { marginBottom: spacing.sm, maxHeight: 40 },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.surfaceSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  periodChipActive: { backgroundColor: colors.light.primaryBg, borderColor: colors.light.primary },
  periodChipTxt: { ...typography.caption, color: colors.light.textMuted, fontWeight: '600' },
  periodChipTxtActive: { color: colors.light.primary },
  kpiLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  kpiLabel: { ...typography.caption, color: colors.light.textMuted },
  kpiValue: { ...typography.caption, color: colors.light.text, fontWeight: '700' },
  disclaimer: { ...typography.caption, color: colors.light.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  saleRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.light.borderLight },
  saleLeft: { flex: 1 },
  saleTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.light.text },
  saleMeta: { ...typography.caption, color: colors.light.textMuted, marginTop: 2 },
  salePart: { ...typography.caption, color: colors.light.textSecondary, marginTop: 4 },
  stockMvRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.light.borderLight },
  stockMvTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.light.text },
  stockMvMeta: { ...typography.caption, color: colors.light.textMuted, marginTop: 2 },
});
