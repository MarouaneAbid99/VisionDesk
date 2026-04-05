import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { getInitials, getFullName } from '../../utils';
import { deskService } from '../../services';

const APP_VERSION = '1.0.0';
const APP_NAME = 'VisionDesk';

type SettingItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

function SettingItem({ icon, iconColor, label, value, onPress, rightElement, danger }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? colors.light.errorBg : colors.light.surfaceSecondary }]}>
        <Ionicons name={icon} size={20} color={iconColor || (danger ? colors.light.error : colors.light.primary)} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />)}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user, shop, logout } = useAuthStore();
  const { data: deskSummary } = useQuery({
    queryKey: ['desk', 'summary'],
    queryFn: deskService.getSummary,
  });
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear auth state and token
      await logout();
      
      // Navigation will be handled automatically by RootNavigator
      setShowLogoutModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      SUPERADMIN: 'Super Admin',
      OWNER: 'Propriétaire',
      ADMIN: 'Administrateur',
      OPTICIAN: 'Opticien',
      TECHNICIAN: 'Technicien',
    };
    return roles[role] || role;
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@visiondesk.ma?subject=Support VisionDesk Mobile');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={[colors.light.primary, colors.light.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.userName}>
          {getFullName(user?.firstName, user?.lastName)}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role || '')}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
          <Card variant="elevated" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.light.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.light.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nom complet</Text>
                <Text style={styles.infoValue}>{getFullName(user?.firstName, user?.lastName)}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.light.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Rôle</Text>
                <Text style={styles.infoValue}>{getRoleLabel(user?.role || '')}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Shop Info Section */}
        {shop && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BOUTIQUE</Text>
            <Card variant="elevated" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="storefront-outline" size={20} color={colors.light.secondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nom de la boutique</Text>
                  <Text style={styles.infoValue}>{shop.name}</Text>
                </View>
              </View>
              {shop.address && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color={colors.light.secondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Adresse</Text>
                      <Text style={styles.infoValue}>{shop.address}</Text>
                    </View>
                  </View>
                </>
              )}
              {shop.phone && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color={colors.light.secondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>{shop.phone}</Text>
                    </View>
                  </View>
                </>
              )}
              {shop.email && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color={colors.light.secondary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email boutique</Text>
                      <Text style={styles.infoValue}>{shop.email}</Text>
                    </View>
                  </View>
                </>
              )}
            </Card>
          </View>
        )}

        {/* Quick business stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APERÇU BUSINESS</Text>
          <Card variant="elevated">
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{deskSummary?.activeOrders ?? 0}</Text>
                <Text style={styles.quickStatLabel}>Actives</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{deskSummary?.ordersReady ?? 0}</Text>
                <Text style={styles.quickStatLabel}>Prêtes</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{deskSummary?.lowStockItems ?? 0}</Text>
                <Text style={styles.quickStatLabel}>Stock bas</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
          <Card variant="elevated" style={styles.settingsCard}>
            <SettingItem
              icon="moon-outline"
              label="Mode sombre"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.light.border, true: colors.light.primaryLight }}
                  thumbColor={darkMode ? colors.light.primary : colors.light.surface}
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="notifications-outline"
              label="Notifications"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.light.border, true: colors.light.primaryLight }}
                  thumbColor={notifications ? colors.light.primary : colors.light.surface}
                />
              }
            />
            <View style={styles.divider} />
            <SettingItem
              icon="language-outline"
              label="Langue"
              value="Français"
              onPress={() => Alert.alert('Langue', 'Fonctionnalité à venir')}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <Card variant="elevated" style={styles.settingsCard}>
            <SettingItem
              icon="help-circle-outline"
              label="Aide & FAQ"
              onPress={() => Alert.alert('Aide', 'Centre d\'aide à venir')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble-outline"
              label="Contacter le support"
              onPress={handleSupport}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              label="Conditions d'utilisation"
              onPress={() => Alert.alert('CGU', 'Conditions d\'utilisation à venir')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield-outline"
              label="Politique de confidentialité"
              onPress={() => Alert.alert('Confidentialité', 'Politique de confidentialité à venir')}
            />
          </Card>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICATION</Text>
          <Card variant="elevated" style={styles.settingsCard}>
            <SettingItem
              icon="information-circle-outline"
              label="Version"
              value={`${APP_NAME} v${APP_VERSION}`}
            />
          </Card>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.light.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {APP_NAME} © {new Date().getFullYear()}
          </Text>
          <Text style={styles.footerSubtext}>
            Solution de gestion pour opticiens
          </Text>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={32} color={colors.light.error} />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerGradient: {
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.light.success,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
    marginTop: -spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.light.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  infoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.light.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.light.borderLight,
    marginHorizontal: spacing.md,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  quickStatValue: {
    ...typography.h4,
    color: colors.light.text,
    fontWeight: '700',
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    color: colors.light.text,
    fontWeight: '500',
  },
  settingValue: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  dangerText: {
    color: colors.light.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.errorBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.errorLight,
  },
  logoutText: {
    ...typography.body,
    color: colors.light.error,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.light.textMuted,
    fontWeight: '500',
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.light.textMuted,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.light.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.light.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  modalMessage: {
    ...typography.body,
    color: colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.light.surfaceSecondary,
  },
  modalButtonCancelText: {
    ...typography.body,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: colors.light.error,
  },
  modalButtonConfirmText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
});
