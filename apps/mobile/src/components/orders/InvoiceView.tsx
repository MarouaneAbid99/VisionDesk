import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { formatCurrency, formatDate } from '../../utils';
import { InvoiceData } from '../../services/orders';

interface InvoiceViewProps {
  data: InvoiceData;
  onClose: () => void;
}

const RECEIPT_MAX_WIDTH = 360;

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined });

function rxVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

function rxHeightLine(prescription: Record<string, unknown> | null | undefined): string | null {
  if (!prescription) return null;
  const odH = prescription.odHeight ?? prescription.odH;
  const osH = prescription.osHeight ?? prescription.osH;
  const h = prescription.h;
  if (odH == null && osH == null && h == null) return null;
  if (odH != null || osH != null) {
    return `H  OD ${rxVal(odH)} · OS ${rxVal(osH)}`;
  }
  return `H  ${rxVal(h)}`;
}

function PaymentBadge({
  status,
  label,
}: {
  status?: InvoiceData['paymentStatus'];
  label?: string;
}) {
  const text = label ?? '—';
  const bg =
    status === 'PAID'
      ? colors.light.successBg
      : status === 'PARTIAL'
        ? colors.light.warningBg
        : status === 'UNPAID'
          ? colors.light.errorBg
          : colors.light.surfaceSecondary;
  const border =
    status === 'PAID'
      ? colors.light.success
      : status === 'PARTIAL'
        ? '#f59e0b'
        : status === 'UNPAID'
          ? colors.light.error
          : colors.light.border;
  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.statusPillText}>{text}</Text>
    </View>
  );
}

export function InvoiceView({ data, onClose }: InvoiceViewProps) {
  const statusLabel =
    data.paymentStatusLabel ??
    (data.paymentStatus === 'PAID'
      ? 'Payé'
      : data.paymentStatus === 'PARTIAL'
        ? 'Partiel'
        : data.paymentStatus === 'UNPAID'
          ? 'Non payé'
          : undefined);

  const handleShare = async () => {
    try {
      const invoiceText = generateInvoiceText(data);
      await Share.share({
        message: invoiceText,
        title: `Bon ${data.invoice.number}`,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager le bon');
    }
  };

  const p = data.prescription;
  const hLine = p ? rxHeightLine(p as Record<string, unknown>) : null;
  const prescriptionPresence =
    data.prescriptionPresence ?? (p ? 'linked' : 'not_linked');

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={onClose} style={styles.toolbarBtn} accessibilityLabel="Fermer">
          <Ionicons name="close" size={22} color={colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Bon / Facture</Text>
        <TouchableOpacity onPress={handleShare} style={styles.toolbarBtn} accessibilityLabel="Partager">
          <Ionicons name="share-outline" size={22} color={colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receipt}>
          <View style={styles.receiptHeaderBand} />
          <Text style={styles.receiptShopName} numberOfLines={2}>
            {data.shop.name}
          </Text>
          {data.shop.phone ? (
            <Text style={styles.receiptShopMeta} numberOfLines={1}>
              {data.shop.phone}
            </Text>
          ) : null}
          {data.shop.email ? (
            <Text style={styles.receiptShopMeta} numberOfLines={2}>
              {data.shop.email}
            </Text>
          ) : null}
          {!data.shop.phone && !data.shop.email && data.shop.address ? (
            <Text style={styles.receiptShopMeta} numberOfLines={2}>
              {data.shop.address}
            </Text>
          ) : null}

          <View style={styles.rule} />

          {data.client && (
            <>
              <Text style={styles.receiptLabel}>Client</Text>
              <Text style={styles.receiptStrong}>{data.client.name}</Text>
              {data.client.phone ? <Text style={styles.receiptLine}>{data.client.phone}</Text> : null}
              <View style={styles.ruleThin} />
            </>
          )}

          <Text style={styles.receiptLabel}>Commande</Text>
          <Text style={styles.receiptLineMono}>N° {data.invoice.orderNumber}</Text>
          <Text style={styles.receiptMuted}>{formatDate(data.invoice.orderDate)}</Text>
          <Text style={styles.receiptMuted}>Bon {data.invoice.number}</Text>

          <View style={styles.rule} />
          <Text style={styles.receiptLabel}>Prescription</Text>
          {prescriptionPresence === 'linked' && p ? (
            <>
              <View style={styles.rxTable}>
                <View style={styles.rxHeaderRow}>
                  <Text style={[styles.rxHCellEye, styles.rxHeaderText]} />
                  <Text style={[styles.rxHCell, styles.rxHeaderText]}>SPH</Text>
                  <Text style={[styles.rxHCell, styles.rxHeaderText]}>CYL</Text>
                  <Text style={[styles.rxHCell, styles.rxHeaderText]}>AXE</Text>
                  <Text style={[styles.rxHCell, styles.rxHeaderText]}>ADD</Text>
                </View>
                <View style={styles.rxDataRow}>
                  <Text style={styles.rxHCellEye}>OD</Text>
                  <Text style={styles.rxCell}>{rxVal(p.odSph)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.odCyl)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.odAxis)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.odAdd)}</Text>
                </View>
                <View style={styles.rxDataRow}>
                  <Text style={styles.rxHCellEye}>OG</Text>
                  <Text style={styles.rxCell}>{rxVal(p.osSph)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.osCyl)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.osAxis)}</Text>
                  <Text style={styles.rxCell}>{rxVal(p.osAdd)}</Text>
                </View>
              </View>
              {(p.pdFar != null || p.pdNear != null) && (
                <Text style={styles.rxPdLine}>
                  PD / EP · loin {rxVal(p.pdFar)} · près {rxVal(p.pdNear)}
                </Text>
              )}
              {hLine ? <Text style={styles.rxPdLine}>{hLine}</Text> : null}
              {p.doctorName ? <Text style={styles.receiptMuted}>Dr. {p.doctorName}</Text> : null}
            </>
          ) : prescriptionPresence === 'missing' ? (
            <Text style={styles.rxEmpty}>Référence ordonnance invalide ou supprimée.</Text>
          ) : (
            <Text style={styles.rxEmpty}>Aucune ordonnance liée</Text>
          )}

          <View style={styles.rule} />

          <Text style={styles.receiptLabel}>Articles</Text>
          {data.items.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.itemTitle} numberOfLines={3}>
                  {item.description}
                </Text>
                {item.details ? (
                  <Text style={styles.itemDetails} numberOfLines={2}>
                    {item.details}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
            </View>
          ))}

          <View style={styles.rule} />

          <View style={styles.totalsBlock}>
            <Text style={styles.totalsBlockTitle}>Totaux</Text>
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Sous-total</Text>
              <Text style={styles.moneyVal}>{formatCurrency(data.pricing.subtotal)}</Text>
            </View>
            {data.pricing.discount > 0 ? (
              <View style={styles.moneyRow}>
                <Text style={styles.moneyLabel}>Remise</Text>
                <Text style={[styles.moneyVal, { color: colors.light.success }]}>
                  -{formatCurrency(data.pricing.discount)}
                </Text>
              </View>
            ) : null}
            <View style={[styles.moneyRow, styles.moneyRowTotal]}>
              <Text style={styles.moneyTotalLabel}>Total</Text>
              <Text style={styles.moneyTotalVal}>{formatCurrency(data.pricing.total)}</Text>
            </View>
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Payé</Text>
              <Text style={styles.moneyVal}>{formatCurrency(data.pricing.deposit)}</Text>
            </View>
            <View style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>Reste</Text>
              <Text
                style={[
                  styles.moneyVal,
                  { fontWeight: '700', color: data.pricing.remaining > 0 ? colors.light.error : colors.light.success },
                ]}
              >
                {formatCurrency(data.pricing.remaining)}
              </Text>
            </View>

            {statusLabel ? (
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeCaption}>Paiement</Text>
                <PaymentBadge status={data.paymentStatus} label={statusLabel} />
              </View>
            ) : null}
          </View>

          <View style={styles.rule} />

          <Text style={styles.footerThanks}>Merci de votre confiance.</Text>
          {data.createdBy ? <Text style={styles.footerTiny}>Saisie : {data.createdBy}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function generateInvoiceText(data: InvoiceData): string {
  const st =
    data.paymentStatusLabel ??
    (data.paymentStatus === 'PAID'
      ? 'Payé'
      : data.paymentStatus === 'PARTIAL'
        ? 'Partiel'
        : data.paymentStatus === 'UNPAID'
          ? 'Non payé'
          : '—');

  let text = `${data.shop.name}
${[data.shop.phone, data.shop.email].filter(Boolean).join(' | ')}

Bon ${data.invoice.number}
Cmd N° ${data.invoice.orderNumber} · ${formatDate(data.invoice.orderDate)}
─────────────────────
`;

  if (data.client) {
    text += `Client: ${data.client.name}\n${data.client.phone || ''}\n─────────────────────\n`;
  }

  const prPres = data.prescriptionPresence ?? (data.prescription ? 'linked' : 'not_linked');
  text += `PRESCRIPTION\n`;
  if (prPres === 'linked' && data.prescription) {
    const pr = data.prescription;
    text += `      SPH    CYL   AXE   ADD\n`;
    text += `OD  ${rxVal(pr.odSph).padStart(6)} ${rxVal(pr.odCyl).padStart(6)} ${rxVal(pr.odAxis).padStart(5)} ${rxVal(pr.odAdd).padStart(5)}\n`;
    text += `OG  ${rxVal(pr.osSph).padStart(6)} ${rxVal(pr.osCyl).padStart(6)} ${rxVal(pr.osAxis).padStart(5)} ${rxVal(pr.osAdd).padStart(5)}\n`;
    if (pr.pdFar != null || pr.pdNear != null) {
      text += `PD/EP loin ${rxVal(pr.pdFar)} · près ${rxVal(pr.pdNear)}\n`;
    }
    const hLine = rxHeightLine(pr as Record<string, unknown>);
    if (hLine) text += `${hLine}\n`;
  } else if (prPres === 'missing') {
    text += `Référence ordonnance invalide ou supprimée.\n`;
  } else {
    text += `Aucune ordonnance liée\n`;
  }
  text += `─────────────────────\n`;

  data.items.forEach((item) => {
    text += `${item.description}\n${formatCurrency(item.price)}\n`;
  });

  text += `─────────────────────
Total:     ${formatCurrency(data.pricing.total)}
Payé:      ${formatCurrency(data.pricing.deposit)}
Reste:     ${formatCurrency(data.pricing.remaining)}
Statut:    ${st}
MAD
Merci !`;

  return text;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  toolbarBtn: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  toolbarTitle: {
    ...typography.label,
    fontWeight: '700',
    color: colors.light.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  receipt: {
    width: '100%',
    maxWidth: RECEIPT_MAX_WIDTH,
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingTop: 0,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  receiptHeaderBand: {
    height: 4,
    backgroundColor: colors.light.primary,
    marginHorizontal: -spacing.sm,
    marginBottom: spacing.sm,
  },
  receiptShopName: {
    ...typography.label,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.light.text,
  },
  receiptShopMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.light.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  rule: {
    height: 1,
    backgroundColor: colors.light.border,
    marginVertical: spacing.sm,
  },
  ruleThin: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.light.borderLight,
    marginVertical: spacing.sm,
  },
  receiptLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  totalsBlock: {
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.borderLight,
  },
  totalsBlockTitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.light.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  receiptStrong: {
    ...typography.body,
    fontWeight: '700',
    color: colors.light.text,
    fontSize: 15,
  },
  receiptLine: {
    ...typography.caption,
    color: colors.light.text,
    marginTop: 1,
  },
  receiptLineMono: {
    fontFamily: mono,
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.text,
  },
  receiptMuted: {
    ...typography.caption,
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  rxTable: {
    borderWidth: 1,
    borderColor: colors.light.borderLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  rxHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceSecondary,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.borderLight,
  },
  rxDataRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.light.borderLight,
  },
  rxHeaderText: {
    color: colors.light.textMuted,
    fontWeight: '700',
    fontSize: 9,
  },
  rxHCellEye: {
    width: 28,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.light.text,
  },
  rxHCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: mono,
    fontSize: 9,
  },
  rxCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: mono,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    color: colors.light.text,
  },
  rxPdLine: {
    fontFamily: mono,
    fontSize: 10,
    lineHeight: 14,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  rxEmpty: {
    ...typography.caption,
    fontSize: 12,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.light.borderLight,
  },
  lineItemLeft: {
    flex: 1,
  },
  itemTitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.light.text,
    fontWeight: '600',
  },
  itemDetails: {
    ...typography.caption,
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 1,
  },
  itemPrice: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.text,
    minWidth: 80,
    textAlign: 'right',
    fontFamily: mono,
    fontVariant: ['tabular-nums'],
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  moneyRowTotal: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.light.border,
  },
  moneyLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  moneyVal: {
    ...typography.caption,
    fontSize: 12,
    color: colors.light.text,
    fontFamily: mono,
    fontVariant: ['tabular-nums'],
  },
  moneyTotalLabel: {
    ...typography.label,
    fontSize: 14,
    color: colors.light.text,
    fontWeight: '700',
  },
  moneyTotalVal: {
    ...typography.label,
    fontSize: 14,
    color: colors.light.primary,
    fontWeight: '800',
    fontFamily: mono,
    fontVariant: ['tabular-nums'],
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  badgeCaption: {
    ...typography.caption,
    fontSize: 10,
    color: colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.text,
  },
  footerThanks: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.light.textSecondary,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  footerTiny: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.light.textMuted,
    marginTop: 4,
    fontSize: 10,
  },
});
