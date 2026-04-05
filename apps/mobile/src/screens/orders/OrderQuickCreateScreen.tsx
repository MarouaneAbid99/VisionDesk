import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ordersService, clientsService, stockService } from '../../services';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { useToast } from '../../contexts';
import { Client, Frame, Lens } from '../../types';
import { getFullName, formatCurrency } from '../../utils';

type OrderType = 'complete' | 'frame_only' | 'lenses_only';

const ORDER_TYPES: { value: OrderType; label: string; icon: string; desc: string }[] = [
  { value: 'complete', label: 'Équipement complet', icon: 'glasses', desc: 'Monture + Verres' },
  { value: 'frame_only', label: 'Monture seule', icon: 'glasses-outline', desc: 'Sans verres' },
  { value: 'lenses_only', label: 'Verres seuls', icon: 'eye', desc: 'Renouvellement' },
];

export function OrderQuickCreateScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useToast();

  // Client state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  
  // Order type
  const [orderType, setOrderType] = useState<OrderType>('complete');
  
  // Stock selection
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
  const [showFramePicker, setShowFramePicker] = useState(false);
  const [showLensPicker, setShowLensPicker] = useState(false);
  const [frameSearch, setFrameSearch] = useState('');
  const [lensSearch, setLensSearch] = useState('');
  
  // Other fields
  const [notes, setNotes] = useState('');
  /** Montage + remise: saisie explicite (MAD). Total = monture + verres + montage − remise */
  const [serviceMontage, setServiceMontage] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');

  // Queries
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', { search: clientSearch }],
    queryFn: () => clientsService.getAll({ search: clientSearch, limit: 20 }),
    enabled: showClientPicker,
  });

  const { data: framesData, isLoading: framesLoading } = useQuery({
    queryKey: ['frames', { search: frameSearch }],
    queryFn: () => stockService.getFrames({ search: frameSearch, limit: 30 }),
    enabled: showFramePicker,
  });

  const { data: lensesData, isLoading: lensesLoading } = useQuery({
    queryKey: ['lenses', { search: lensSearch }],
    queryFn: () => stockService.getLenses({ search: lensSearch, limit: 30 }),
    enabled: showLensPicker,
  });

  const frameBase = useMemo(() => {
    if (!selectedFrame || orderType === 'lenses_only') return 0;
    return Number(selectedFrame.salePrice) || 0;
  }, [selectedFrame, orderType]);

  const lensBase = useMemo(() => {
    if (!selectedLens || orderType === 'frame_only') return 0;
    return Number(selectedLens.salePrice) || 0;
  }, [selectedLens, orderType]);

  const parsedService = useMemo(() => {
    const v = parseFloat(String(serviceMontage).replace(',', '.'));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }, [serviceMontage]);

  const parsedDiscount = useMemo(() => {
    const v = parseFloat(String(discountInput).replace(',', '.'));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }, [discountInput]);

  const finalTotal = useMemo(() => {
    return Math.max(0, Number((frameBase + lensBase + parsedService - parsedDiscount).toFixed(2)));
  }, [frameBase, lensBase, parsedService, parsedDiscount]);

  const createMutation = useMutation({
    mutationFn: ordersService.create,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['desk'] });
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      showSuccess(`Commande ${order.orderNumber} créée`);
      setTimeout(() => navigation.navigate('OrderDetail', { id: order.id }), 300);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Impossible de créer la commande');
    },
  });

  const handleSubmit = () => {
    if (!selectedClient) {
      showWarning('Veuillez sélectionner un client');
      return;
    }

    // Validate based on order type
    if (orderType === 'complete' || orderType === 'frame_only') {
      if (!selectedFrame) {
        showWarning('Veuillez sélectionner une monture');
        return;
      }
    }
    if (orderType === 'complete' || orderType === 'lenses_only') {
      if (!selectedLens) {
        showWarning('Veuillez sélectionner des verres');
        return;
      }
    }
    
    const fp = orderType === 'lenses_only' ? 0 : Number(selectedFrame?.salePrice) || 0;
    const lp = orderType === 'frame_only' ? 0 : Number(selectedLens?.salePrice) || 0;
    const servicePrice = parsedService;
    const discount = parsedDiscount;
    const totalCheck = fp + lp + servicePrice - discount;
    if (totalCheck < 0) {
      showWarning('Le total ne peut pas être négatif (vérifiez la remise)');
      return;
    }

    createMutation.mutate({
      clientId: selectedClient.id,
      frameId: selectedFrame?.id || undefined,
      lensId: selectedLens?.id || undefined,
      framePrice: fp,
      lensPrice: lp,
      servicePrice,
      discount,
      notes: notes.trim() || undefined,
    });
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientPicker(false);
    setClientSearch('');
  };

  const handleSelectFrame = (frame: Frame) => {
    setSelectedFrame(frame);
    setShowFramePicker(false);
    setFrameSearch('');
  };

  const handleSelectLens = (lens: Lens) => {
    setSelectedLens(lens);
    setShowLensPicker(false);
    setLensSearch('');
  };

  // Clear selections when order type changes
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'lenses_only') setSelectedFrame(null);
    if (type === 'frame_only') setSelectedLens(null);
  };

  const isValid = useMemo(() => {
    if (!selectedClient) return false;
    if ((orderType === 'complete' || orderType === 'frame_only') && !selectedFrame) return false;
    if ((orderType === 'complete' || orderType === 'lenses_only') && !selectedLens) return false;
    return true;
  }, [selectedClient, selectedFrame, selectedLens, orderType]);

  // Progress steps calculation
  const completedSteps = useMemo(() => {
    let steps = 0;
    if (selectedClient) steps++;
    if (orderType === 'lenses_only' || selectedFrame) steps++;
    if (orderType === 'frame_only' || selectedLens) steps++;
    return steps;
  }, [selectedClient, selectedFrame, selectedLens, orderType]);

  const totalSteps = orderType === 'complete' ? 3 : 2;
  const progressPercent = (completedSteps / totalSteps) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedSteps}/{totalSteps} étapes</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step indicator header removed - using progress bar instead */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client *</Text>
          <Pressable
            style={({ pressed }) => [styles.clientSelector, pressed && styles.clientSelectorPressed, selectedClient && styles.clientSelectorSelected]}
            onPress={() => setShowClientPicker(true)}
          >
            {selectedClient ? (
              <View style={styles.selectedClientRow}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>{selectedClient.firstName[0]}{selectedClient.lastName[0]}</Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>{getFullName(selectedClient.firstName, selectedClient.lastName)}</Text>
                  {selectedClient.phone && <Text style={styles.clientPhone}>{selectedClient.phone}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
              </View>
            ) : (
              <View style={styles.placeholderRow}>
                <Ionicons name="person-add-outline" size={24} color={colors.light.textMuted} />
                <Text style={styles.placeholderText}>Sélectionner un client</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Order Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de commande</Text>
          <View style={styles.orderTypeGrid}>
            {ORDER_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={({ pressed }) => [
                  styles.orderTypeCard,
                  orderType === type.value && styles.orderTypeCardActive,
                  pressed && styles.orderTypeCardPressed,
                ]}
                onPress={() => handleOrderTypeChange(type.value)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={orderType === type.value ? colors.light.primary : colors.light.textMuted}
                />
                <Text style={[styles.orderTypeLabel, orderType === type.value && styles.orderTypeLabelActive]}>
                  {type.label}
                </Text>
                <Text style={styles.orderTypeDesc}>{type.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Frame Selection */}
        {orderType !== 'lenses_only' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monture *</Text>
            <Pressable
              style={({ pressed }) => [styles.productSelector, pressed && styles.productSelectorPressed, selectedFrame && styles.productSelectorSelected]}
              onPress={() => setShowFramePicker(true)}
            >
              {selectedFrame ? (
                <View style={styles.selectedProductRow}>
                  <View style={[styles.productIcon, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="glasses" size={20} color="#d97706" />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{selectedFrame.brand?.name || 'Sans marque'} - {selectedFrame.reference}</Text>
                    <Text style={styles.productMeta}>{selectedFrame.color} • Stock: {selectedFrame.quantity}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatCurrency(selectedFrame.salePrice)}</Text>
                </View>
              ) : (
                <View style={styles.placeholderRow}>
                  <Ionicons name="glasses-outline" size={24} color={colors.light.textMuted} />
                  <Text style={styles.placeholderText}>Sélectionner une monture</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Lens Selection */}
        {orderType !== 'frame_only' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verres *</Text>
            <Pressable
              style={({ pressed }) => [styles.productSelector, pressed && styles.productSelectorPressed, selectedLens && styles.productSelectorSelected]}
              onPress={() => setShowLensPicker(true)}
            >
              {selectedLens ? (
                <View style={styles.selectedProductRow}>
                  <View style={[styles.productIcon, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="eye" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{selectedLens.name}</Text>
                    <Text style={styles.productMeta}>{selectedLens.lensType} • {selectedLens.coating}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatCurrency(selectedLens.salePrice)}</Text>
                </View>
              ) : (
                <View style={styles.placeholderRow}>
                  <Ionicons name="eye-outline" size={24} color={colors.light.textMuted} />
                  <Text style={styles.placeholderText}>Sélectionner des verres</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Instructions, urgence, détails..."
            placeholderTextColor={colors.light.textMuted}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={20} color={colors.light.primary} />
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          {/* Client */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryRowLeft}>
              <Ionicons name="person" size={16} color={selectedClient ? colors.light.success : colors.light.textMuted} />
              <Text style={styles.summaryRowLabel}>Client</Text>
            </View>
            <Text style={[styles.summaryRowValue, !selectedClient && styles.summaryRowMissing]}>
              {selectedClient ? getFullName(selectedClient.firstName, selectedClient.lastName) : 'Non sélectionné'}
            </Text>
          </View>

          {/* Frame */}
          {orderType !== 'lenses_only' && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLeft}>
                <Ionicons name="glasses" size={16} color={selectedFrame ? colors.light.success : colors.light.textMuted} />
                <Text style={styles.summaryRowLabel}>Monture</Text>
              </View>
              {selectedFrame ? (
                <View style={styles.summaryRowRight}>
                  <Text style={styles.summaryRowValue}>{selectedFrame.brand?.name || selectedFrame.reference}</Text>
                  <Text style={styles.summaryRowPrice}>{formatCurrency(selectedFrame.salePrice)}</Text>
                </View>
              ) : (
                <Text style={styles.summaryRowMissing}>Non sélectionnée</Text>
              )}
            </View>
          )}

          {/* Lens */}
          {orderType !== 'frame_only' && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryRowLeft}>
                <Ionicons name="eye" size={16} color={selectedLens ? colors.light.success : colors.light.textMuted} />
                <Text style={styles.summaryRowLabel}>Verres</Text>
              </View>
              {selectedLens ? (
                <View style={styles.summaryRowRight}>
                  <Text style={styles.summaryRowValue}>{selectedLens.name}</Text>
                  <Text style={styles.summaryRowPrice}>{formatCurrency(selectedLens.salePrice)}</Text>
                </View>
              ) : (
                <Text style={styles.summaryRowMissing}>Non sélectionnés</Text>
              )}
            </View>
          )}

          <View style={styles.summaryDivider} />

          <Text style={styles.breakdownHint}>Service de montage et remise (figés après création)</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryRowLeft}>
              <Ionicons name="construct-outline" size={16} color={colors.light.primary} />
              <Text style={styles.summaryRowLabel}>Service de montage</Text>
            </View>
            <View style={styles.manualInputWrapInline}>
              <TextInput
                style={styles.serviceInput}
                value={serviceMontage}
                onChangeText={setServiceMontage}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.light.textMuted}
              />
              <Text style={styles.manualCurrency}>MAD</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryRowLeft}>
              <Ionicons name="pricetag-outline" size={16} color={colors.light.textSecondary} />
              <Text style={styles.summaryRowLabel}>Remise</Text>
            </View>
            <View style={styles.manualInputWrapInline}>
              <TextInput
                style={styles.serviceInput}
                value={discountInput}
                onChangeText={setDiscountInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.light.textMuted}
              />
              <Text style={styles.manualCurrency}>MAD</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Total */}
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(finalTotal)}</Text>
          </View>
          <Text style={styles.manualHint}>Total = monture + verres + montage − remise</Text>
        </View>

        {/* Validation Messages */}
        {!isValid && (
          <View style={styles.validationBox}>
            <Ionicons name="alert-circle" size={18} color={colors.light.warning} />
            <Text style={styles.validationText}>
              {!selectedClient ? 'Sélectionnez un client pour continuer' :
               (orderType !== 'lenses_only' && !selectedFrame) ? 'Sélectionnez une monture' :
               'Sélectionnez des verres'}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, styles.submitButton, (!isValid || createMutation.isPending) && styles.buttonDisabled, pressed && isValid && styles.submitButtonPressed]}
            onPress={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <><ActivityIndicator size="small" color="#fff" /><Text style={styles.submitButtonText}>Création...</Text></>
            ) : (
              <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.submitButtonText}>Créer la commande</Text></>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowClientPicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un client</Text>
            <Pressable style={styles.modalClose} onPress={() => setShowClientPicker(false)}>
              <Ionicons name="close" size={24} color={colors.light.text} />
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.light.textMuted} />
            <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor={colors.light.textMuted} value={clientSearch} onChangeText={setClientSearch} autoFocus />
          </View>
          <FlatList
            data={clientsData?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]} onPress={() => handleSelectClient(item)}>
                <View style={styles.clientItemAvatar}><Text style={styles.clientItemAvatarText}>{item.firstName[0]}{item.lastName[0]}</Text></View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{getFullName(item.firstName, item.lastName)}</Text>
                  {item.phone && <Text style={styles.listItemMeta}>{item.phone}</Text>}
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyState}><Ionicons name="people-outline" size={48} color={colors.light.textMuted} /><Text style={styles.emptyText}>{clientsLoading ? 'Chargement...' : 'Aucun client trouvé'}</Text></View>}
          />
          <Pressable style={({ pressed }) => [styles.modalAction, pressed && { opacity: 0.9 }]} onPress={() => { setShowClientPicker(false); navigation.navigate('ClientQuickCreate'); }}>
            <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.modalActionText}>Nouveau client</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Frame Picker Modal */}
      <Modal visible={showFramePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFramePicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une monture</Text>
            <Pressable style={styles.modalClose} onPress={() => setShowFramePicker(false)}>
              <Ionicons name="close" size={24} color={colors.light.text} />
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.light.textMuted} />
            <TextInput style={styles.searchInput} placeholder="Rechercher par marque, référence..." placeholderTextColor={colors.light.textMuted} value={frameSearch} onChangeText={setFrameSearch} autoFocus />
          </View>
          <FlatList
            data={framesData?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedFrame?.id === item.id;
              return (
                <Pressable 
                  style={({ pressed }) => [
                    styles.listItem, 
                    pressed && styles.listItemPressed, 
                    item.quantity === 0 && styles.listItemDisabled,
                    isSelected && styles.listItemSelected
                  ]} 
                  onPress={() => item.quantity > 0 && handleSelectFrame(item)} 
                  disabled={item.quantity === 0}
                >
                  <View style={[styles.productIconSmall, { backgroundColor: isSelected ? '#dcfce7' : '#fef3c7' }]}>
                    <Ionicons name={isSelected ? 'checkmark' : 'glasses'} size={18} color={isSelected ? '#16a34a' : '#d97706'} />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemName, isSelected && styles.listItemNameSelected]}>{item.brand?.name || 'Sans marque'} - {item.reference}</Text>
                    <Text style={styles.listItemMeta}>{item.color} {item.size && `• ${item.size}`}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemPrice}>{formatCurrency(item.salePrice)}</Text>
                    <Text style={[styles.listItemStock, item.quantity === 0 && styles.listItemStockOut, item.quantity <= 3 && item.quantity > 0 && styles.listItemStockLow]}>
                      {item.quantity === 0 ? 'Épuisé' : item.quantity <= 3 ? `⚠ ${item.quantity} restant${item.quantity > 1 ? 's' : ''}` : `Stock: ${item.quantity}`}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {framesLoading ? (
                  <><ActivityIndicator size="large" color={colors.light.primary} /><Text style={styles.emptyText}>Chargement...</Text></>
                ) : (
                  <><Ionicons name="glasses-outline" size={48} color={colors.light.textMuted} /><Text style={styles.emptyText}>Aucune monture trouvée</Text></>
                )}
              </View>
            }
          />
        </View>
      </Modal>

      {/* Lens Picker Modal */}
      <Modal visible={showLensPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLensPicker(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner des verres</Text>
            <Pressable style={styles.modalClose} onPress={() => setShowLensPicker(false)}>
              <Ionicons name="close" size={24} color={colors.light.text} />
            </Pressable>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.light.textMuted} />
            <TextInput style={styles.searchInput} placeholder="Rechercher par nom, type..." placeholderTextColor={colors.light.textMuted} value={lensSearch} onChangeText={setLensSearch} autoFocus />
          </View>
          <FlatList
            data={lensesData?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedLens?.id === item.id;
              return (
                <Pressable 
                  style={({ pressed }) => [
                    styles.listItem, 
                    pressed && styles.listItemPressed, 
                    item.quantity === 0 && styles.listItemDisabled,
                    isSelected && styles.listItemSelected
                  ]} 
                  onPress={() => item.quantity > 0 && handleSelectLens(item)} 
                  disabled={item.quantity === 0}
                >
                  <View style={[styles.productIconSmall, { backgroundColor: isSelected ? '#dcfce7' : '#dbeafe' }]}>
                    <Ionicons name={isSelected ? 'checkmark' : 'eye'} size={18} color={isSelected ? '#16a34a' : '#2563eb'} />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemName, isSelected && styles.listItemNameSelected]}>{item.name}</Text>
                    <Text style={styles.listItemMeta}>{item.lensType} • {item.coating}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemPrice}>{formatCurrency(item.salePrice)}</Text>
                    <Text style={[styles.listItemStock, item.quantity === 0 && styles.listItemStockOut, item.quantity <= 3 && item.quantity > 0 && styles.listItemStockLow]}>
                      {item.quantity === 0 ? 'Épuisé' : item.quantity <= 3 ? `⚠ ${item.quantity} restant${item.quantity > 1 ? 's' : ''}` : `Stock: ${item.quantity}`}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {lensesLoading ? (
                  <><ActivityIndicator size="large" color={colors.light.primary} /><Text style={styles.emptyText}>Chargement...</Text></>
                ) : (
                  <><Ionicons name="eye-outline" size={48} color={colors.light.textMuted} /><Text style={styles.emptyText}>Aucun verre trouvé</Text></>
                )}
              </View>
            }
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
  headerIcon: { width: 72, height: 72, borderRadius: borderRadius.xl, backgroundColor: colors.light.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.light.text },
  subtitle: { ...typography.body, color: colors.light.textSecondary, marginTop: spacing.xs },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.light.textSecondary, marginBottom: spacing.sm },
  clientSelector: { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.lg, padding: spacing.md },
  clientSelectorPressed: { backgroundColor: colors.light.surfaceSecondary },
  clientSelectorSelected: { borderColor: colors.light.primary },
  selectedClientRow: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  clientAvatarText: { ...typography.label, color: '#fff', fontWeight: '700' },
  clientDetails: { flex: 1, marginLeft: spacing.md },
  clientName: { ...typography.label, color: colors.light.text, fontWeight: '600' },
  clientPhone: { ...typography.caption, color: colors.light.textSecondary },
  placeholderRow: { flexDirection: 'row', alignItems: 'center' },
  placeholderText: { ...typography.body, color: colors.light.textMuted, flex: 1, marginLeft: spacing.sm },
  orderTypeGrid: { flexDirection: 'row', gap: spacing.sm },
  orderTypeCard: { flex: 1, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  orderTypeCardActive: { borderColor: colors.light.primary, backgroundColor: colors.light.primaryBg },
  orderTypeCardPressed: { opacity: 0.8 },
  orderTypeLabel: { ...typography.caption, color: colors.light.textSecondary, marginTop: spacing.xs, textAlign: 'center', fontWeight: '600' },
  orderTypeLabelActive: { color: colors.light.primary },
  orderTypeDesc: { ...typography.caption, color: colors.light.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  productSelector: { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.lg, padding: spacing.md },
  productSelectorPressed: { backgroundColor: colors.light.surfaceSecondary },
  productSelectorSelected: { borderColor: colors.light.primary },
  selectedProductRow: { flexDirection: 'row', alignItems: 'center' },
  productIcon: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  productIconSmall: { width: 36, height: 36, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  productDetails: { flex: 1, marginLeft: spacing.md },
  productName: { ...typography.label, color: colors.light.text, fontWeight: '600' },
  productMeta: { ...typography.caption, color: colors.light.textSecondary, marginTop: 2 },
  productPrice: { ...typography.label, color: colors.light.primary, fontWeight: '700' },
  priceSummary: { backgroundColor: colors.light.primaryBg, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceSummaryLabel: { ...typography.label, color: colors.light.text, fontWeight: '600' },
  priceSummaryValue: { ...typography.h3, color: colors.light.primary, fontWeight: '700' },
  priceDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  priceDetailLabel: { ...typography.caption, color: colors.light.textSecondary },
  priceDetailValue: { ...typography.caption, color: colors.light.textSecondary },
  notesInput: { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.light.border, borderRadius: borderRadius.md, padding: spacing.md, minHeight: 60, fontSize: 16, color: colors.light.text },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.light.surface, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.light.surfaceSecondary, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.light.primary, borderRadius: 3 },
  progressText: { ...typography.caption, color: colors.light.textSecondary, marginLeft: spacing.md, fontWeight: '600' },
  summaryCard: { backgroundColor: colors.light.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.light.border, ...shadows.sm },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryTitle: { ...typography.label, color: colors.light.text, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: colors.light.border, marginVertical: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  summaryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryRowLabel: { ...typography.body, color: colors.light.textSecondary },
  summaryRowValue: { ...typography.body, color: colors.light.text, fontWeight: '500' },
  summaryRowRight: { alignItems: 'flex-end' },
  summaryRowPrice: { ...typography.caption, color: colors.light.primary, fontWeight: '600' },
  summaryRowMissing: { ...typography.body, color: colors.light.textMuted, fontStyle: 'italic' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xs },
  summaryTotalLabel: { ...typography.label, color: colors.light.text, fontWeight: '700' },
  summaryTotalValue: { ...typography.h3, color: colors.light.primary, fontWeight: '700' },
  manualCurrency: { ...typography.label, color: colors.light.textSecondary },
  manualHint: { ...typography.caption, color: colors.light.textMuted, marginTop: spacing.xs },
  breakdownHint: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  manualInputWrapInline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    minWidth: 120,
  },
  serviceInput: {
    flex: 1,
    minWidth: 56,
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
    paddingVertical: spacing.xs,
    textAlign: 'right',
  },
  validationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  validationText: { ...typography.body, color: '#92400e', flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  cancelButton: { backgroundColor: colors.light.surfaceSecondary },
  cancelButtonText: { ...typography.label, color: colors.light.textSecondary },
  submitButton: { backgroundColor: colors.light.primary, ...shadows.sm },
  submitButtonText: { ...typography.label, color: '#fff', fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  submitButtonPressed: { backgroundColor: '#4338ca', transform: [{ scale: 0.98 }] },
  modalContainer: { flex: 1, backgroundColor: colors.light.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  modalTitle: { ...typography.h4, color: colors.light.text },
  modalClose: { padding: spacing.xs },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, margin: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.light.border },
  searchInput: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, fontSize: 16, color: colors.light.text },
  clientList: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  clientItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.light.borderLight },
  clientItemPressed: { backgroundColor: colors.light.surfaceSecondary },
  clientItemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  clientItemAvatarText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  clientItemInfo: { flex: 1, marginLeft: spacing.md },
  clientItemName: { ...typography.label, color: colors.light.text },
  clientItemPhone: { ...typography.caption, color: colors.light.textSecondary },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.body, color: colors.light.textMuted, marginTop: spacing.md },
  modalAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary, margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  modalActionText: { ...typography.label, color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.light.borderLight },
  listItemPressed: { backgroundColor: colors.light.surfaceSecondary },
  listItemDisabled: { opacity: 0.5 },
  listItemInfo: { flex: 1, marginLeft: spacing.md },
  listItemName: { ...typography.label, color: colors.light.text, fontWeight: '600' },
  listItemMeta: { ...typography.caption, color: colors.light.textSecondary, marginTop: 2 },
  listItemRight: { alignItems: 'flex-end' },
  listItemPrice: { ...typography.label, color: colors.light.primary, fontWeight: '700' },
  listItemStock: { ...typography.caption, color: colors.light.success, marginTop: 2 },
  listItemStockOut: { color: colors.light.error },
  listItemStockLow: { color: '#d97706' },
  listItemSelected: { backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: colors.light.success },
  listItemNameSelected: { color: colors.light.success },
});
