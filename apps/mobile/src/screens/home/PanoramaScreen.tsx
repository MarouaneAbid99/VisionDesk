import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Pressable,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from '../../navigation/types';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { panoramaService, clientsService } from '../../services';
import { LoadingScreen } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Client } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };
const SPRING_CONFIG_FAST = { damping: 25, stiffness: 300, mass: 0.5 };

// Default panorama dimensions (will be updated when image loads)
const DEFAULT_PANORAMA_WIDTH = SCREEN_WIDTH * 2.5; // Assume panorama is 2.5x wider than screen
const DEFAULT_PANORAMA_HEIGHT = SCREEN_HEIGHT;

interface PanoramaHotspot {
  id: string;
  moduleKey: string;
  label: string;
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
}

export function PanoramaScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const [showControls, setShowControls] = useState(true);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: scene, isLoading: sceneLoading, refetch } = useQuery({
    queryKey: ['panorama', 'active-scene'],
    queryFn: panoramaService.getActiveScene,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['clients', 'quick-search', searchQuery],
    queryFn: () => clientsService.getAll({ search: searchQuery, limit: 10 }),
    enabled: showQuickSearch && searchQuery.length >= 2,
  });

  // Track actual panorama image dimensions
  const [imageDimensions, setImageDimensions] = useState({
    width: DEFAULT_PANORAMA_WIDTH,
    height: DEFAULT_PANORAMA_HEIGHT,
    loaded: false,
  });

  // Measure actual image dimensions when scene loads
  useEffect(() => {
    if (scene?.imageUrl) {
      Image.getSize(
        scene.imageUrl,
        (width, height) => {
          setImageDimensions({ width, height, loaded: true });
        },
        (error) => {
          console.warn('Failed to get panorama dimensions:', error);
          // Use default wide panorama dimensions
          setImageDimensions({
            width: DEFAULT_PANORAMA_WIDTH,
            height: DEFAULT_PANORAMA_HEIGHT,
            loaded: true,
          });
        }
      );
    }
  }, [scene?.imageUrl]);

  // Calculate panorama dimensions and scale
  // The panorama should fit the screen height and extend horizontally
  const panoramaMetrics = useMemo(() => {
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    
    // Scale to fit height to screen
    const baseScale = SCREEN_HEIGHT / imgHeight;
    const scaledWidth = imgWidth * baseScale;
    const scaledHeight = SCREEN_HEIGHT;
    
    // How much wider is the panorama than the screen?
    const widthOverflow = Math.max(0, scaledWidth - SCREEN_WIDTH);
    
    return {
      scaledWidth,
      scaledHeight,
      baseScale,
      widthOverflow,
      // Maximum pan at base scale (scale=1 means baseScale in our system)
      maxPanXAtBase: widthOverflow / 2,
      aspectRatio: imgWidth / imgHeight,
    };
  }, [imageDimensions]);

  const handleClientSelect = (client: Client) => {
    setShowQuickSearch(false);
    setSearchQuery('');
    navigation.navigate('ClientDetail', { id: client.id });
  };

  const openQuickSearch = useCallback(() => {
    setShowQuickSearch(true);
  }, []);

  // Gesture state using reanimated shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  
  // Shared values for panorama dimensions (for worklet access)
  const panoramaWidth = useSharedValue(panoramaMetrics.scaledWidth);
  const panoramaHeight = useSharedValue(panoramaMetrics.scaledHeight);
  
  // Sync shared values when panoramaMetrics changes
  useEffect(() => {
    panoramaWidth.value = panoramaMetrics.scaledWidth;
    panoramaHeight.value = panoramaMetrics.scaledHeight;
  }, [panoramaMetrics.scaledWidth, panoramaMetrics.scaledHeight, panoramaWidth, panoramaHeight]);

  // Calculate pan boundaries based on current scale and actual panorama dimensions
  // MUST be worklet for gesture handlers - uses shared values for proper UI thread access
  const getMaxPan = (currentScale: number) => {
    'worklet';
    // Use shared values for panorama dimensions (properly synced with UI thread)
    const scaledWidth = panoramaWidth.value;
    const scaledHeight = panoramaHeight.value;
    
    // At current scale, how big is the panorama?
    const currentWidth = scaledWidth * currentScale;
    const currentHeight = scaledHeight * currentScale;
    
    // How much can we pan? (content size - viewport size) / 2
    const maxPanX = Math.max(0, (currentWidth - SCREEN_WIDTH) / 2);
    const maxPanY = Math.max(0, (currentHeight - SCREEN_HEIGHT) / 2);
    
    return { maxPanX, maxPanY };
  };

  // Clamp value within bounds - worklet for UI thread
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  // Reset view to initial state
  const resetView = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const newScale = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
      scale.value = newScale;
      
      // Adjust translation to keep focal point stable
      const { maxPanX, maxPanY } = getMaxPan(newScale);
      translateX.value = clamp(translateX.value, -maxPanX, maxPanX);
      translateY.value = clamp(translateY.value, -maxPanY, maxPanY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      // Snap back if scale is too low
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING_CONFIG);
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture for navigation with smooth inertia
  // Now allows full horizontal exploration of the panorama
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const { maxPanX, maxPanY } = getMaxPan(scale.value);
      
      // Allow full horizontal panning at any scale (panorama exploration)
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maxPanX,
        maxPanX
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maxPanY,
        maxPanY
      );
    })
    .onEnd((event) => {
      const { maxPanX, maxPanY } = getMaxPan(scale.value);
      
      // Apply inertia with velocity decay for smooth exploration
      const VELOCITY_FACTOR = 0.15;
      const targetX = clamp(
        translateX.value + event.velocityX * VELOCITY_FACTOR,
        -maxPanX,
        maxPanX
      );
      const targetY = clamp(
        translateY.value + event.velocityY * VELOCITY_FACTOR,
        -maxPanY,
        maxPanY
      );
      
      translateX.value = withSpring(targetX, { damping: 20, stiffness: 90, mass: 0.5 });
      translateY.value = withSpring(targetY, { damping: 20, stiffness: 90, mass: 0.5 });
      savedTranslateX.value = targetX;
      savedTranslateY.value = targetY;
    });

  // Double tap gesture for quick zoom with snappy animation
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1.5) {
        // Zoom out - use fast spring for snappy feel
        scale.value = withSpring(1, SPRING_CONFIG_FAST);
        translateX.value = withSpring(0, SPRING_CONFIG_FAST);
        translateY.value = withSpring(0, SPRING_CONFIG_FAST);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to tap location
        const targetScale = 2.5;
        const tapX = event.x - SCREEN_WIDTH / 2;
        const tapY = event.y - SCREEN_HEIGHT / 2;
        
        scale.value = withSpring(targetScale, SPRING_CONFIG_FAST);
        
        // Center on tap point
        const { maxPanX, maxPanY } = getMaxPan(targetScale);
        const newTranslateX = clamp(-tapX * (targetScale - 1), -maxPanX, maxPanX);
        const newTranslateY = clamp(-tapY * (targetScale - 1), -maxPanY, maxPanY);
        
        translateX.value = withSpring(newTranslateX, SPRING_CONFIG_FAST);
        translateY.value = withSpring(newTranslateY, SPRING_CONFIG_FAST);
        
        savedScale.value = targetScale;
        savedTranslateX.value = newTranslateX;
        savedTranslateY.value = newTranslateY;
      }
    });

  // Single tap to toggle controls
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(toggleControls)();
    });

  // Compose all gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  // Animated style for the panorama container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleHotspotPress = useCallback((moduleKey: string) => {
    switch (moduleKey) {
      case 'desk':
        navigation.navigate('Desk');
        break;
      case 'clients':
        navigation.navigate('Clients');
        break;
      case 'atelier':
        navigation.navigate('Atelier');
        break;
      case 'frames':
        navigation.navigate('Stock', { initialTab: 'frames' });
        break;
      case 'lenses':
        navigation.navigate('Stock', { initialTab: 'lenses' });
        break;
      case 'orders':
        navigation.navigate('Orders', {});
        break;
      case 'appointments':
        navigation.navigate('Appointments');
        break;
      case 'suppliers':
        navigation.navigate('Suppliers');
        break;
      default:
        break;
    }
  }, [navigation]);

  const isValidHotspot = (moduleKey: string) => {
    return ['desk', 'clients', 'atelier', 'frames', 'lenses', 'orders', 'appointments', 'suppliers'].includes(moduleKey);
  };

  const validHotspots = useMemo(() => {
    return (scene?.hotspots || []).filter((h: PanoramaHotspot) => isValidHotspot(h.moduleKey));
  }, [scene?.hotspots]);

  if (sceneLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Full-screen panorama with gestures */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.panoramaWrapper}>
          <Animated.View 
            style={[
              styles.panoramaContainer, 
              { 
                width: panoramaMetrics.scaledWidth,
                height: panoramaMetrics.scaledHeight,
                // Center the panorama initially (can pan to see sides)
                left: (SCREEN_WIDTH - panoramaMetrics.scaledWidth) / 2,
              },
              animatedStyle,
            ]}
          >
            {scene?.imageUrl ? (
              <Image
                source={{ uri: scene.imageUrl }}
                style={{
                  width: panoramaMetrics.scaledWidth,
                  height: panoramaMetrics.scaledHeight,
                }}
                resizeMode="stretch"
              />
            ) : (
              <View style={[styles.panoramaImage, styles.panoramaPlaceholder]}>
                <Ionicons name="image-outline" size={64} color={colors.light.textMuted} />
                <Text style={styles.placeholderText}>Aucun panorama configuré</Text>
                <Text style={styles.placeholderSubtext}>
                  Configurez votre panorama depuis l'application web
                </Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Hotspots layer - OUTSIDE GestureDetector to prevent conflicts */}
      {/* Must match panorama container dimensions exactly for alignment */}
      <Animated.View 
        style={[
          styles.hotspotsLayer, 
          {
            width: panoramaMetrics.scaledWidth,
            height: panoramaMetrics.scaledHeight,
            left: (SCREEN_WIDTH - panoramaMetrics.scaledWidth) / 2,
          },
          animatedStyle,
        ]} 
        pointerEvents="box-none"
      >
        {validHotspots.map((hotspot: PanoramaHotspot) => {
          const x = Number(hotspot.x);
          const y = Number(hotspot.y);
          const w = Number(hotspot.w) || 0.12;
          const h = Number(hotspot.h) || 0.12;

          return (
            <Pressable
              key={hotspot.id}
              style={[
                styles.hotspot,
                {
                  left: `${(x - w / 2) * 100}%`,
                  top: `${(y - h / 2) * 100}%`,
                  width: `${w * 100}%`,
                  height: `${h * 100}%`,
                },
              ]}
              onPress={() => handleHotspotPress(hotspot.moduleKey)}
            >
              <View style={styles.hotspotTouchArea} />
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Floating header - only visible when controls shown */}
      {showControls && (
        <View style={styles.floatingHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>VisionDesk</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={openQuickSearch} style={styles.actionButton}>
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetView} style={styles.actionButton}>
              <Ionicons name="scan-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => refetch()} style={styles.actionButton}>
              <Ionicons name="refresh-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating footer with hints */}
      {showControls && (
        <View style={styles.floatingFooter}>
          <View style={styles.gestureHints}>
            <View style={styles.hintItem}>
              <Ionicons name="hand-left-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.hintText}>Glisser</Text>
            </View>
            <View style={styles.hintItem}>
              <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.hintText}>Pincer</Text>
            </View>
            <View style={styles.hintItem}>
              <Ionicons name="finger-print-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.hintText}>Double-tap</Text>
            </View>
          </View>
          {validHotspots.length > 0 && (
            <Text style={styles.hotspotsCount}>
              {validHotspots.length} zone{validHotspots.length > 1 ? 's' : ''} interactive{validHotspots.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Quick Search Modal */}
      <Modal
        visible={showQuickSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickSearch(false)}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Recherche rapide</Text>
            <TouchableOpacity onPress={() => { setShowQuickSearch(false); setSearchQuery(''); }}>
              <Ionicons name="close" size={24} color={colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.light.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Nom, téléphone, email..."
              placeholderTextColor={colors.light.textMuted}
              autoFocus
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.light.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => { setShowQuickSearch(false); navigation.navigate('ClientQuickCreate'); }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="person-add" size={20} color="#2563eb" />
              </View>
              <Text style={styles.quickActionLabel}>Nouveau client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => { setShowQuickSearch(false); navigation.navigate('AppointmentQuickCreate', {}); }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="calendar" size={20} color="#16a34a" />
              </View>
              <Text style={styles.quickActionLabel}>Nouveau RDV</Text>
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          <FlatList
            data={searchResults?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleClientSelect(item)}
              >
                <View style={styles.searchResultAvatar}>
                  <Text style={styles.searchResultAvatarText}>
                    {item.firstName[0]}{item.lastName[0]}
                  </Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.phone && (
                    <Text style={styles.searchResultPhone}>{item.phone}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.light.textMuted} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.searchResultsList}
            ListEmptyComponent={
              searchQuery.length >= 2 ? (
                <View style={styles.searchEmpty}>
                  <Ionicons name="search-outline" size={48} color={colors.light.textMuted} />
                  <Text style={styles.searchEmptyText}>Aucun résultat</Text>
                </View>
              ) : (
                <View style={styles.searchEmpty}>
                  <Ionicons name="people-outline" size={48} color={colors.light.textMuted} />
                  <Text style={styles.searchEmptyText}>Tapez au moins 2 caractères</Text>
                </View>
              )
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  panoramaWrapper: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0a0f1a',
  },
  panoramaContainer: {
    // Dimensions set dynamically based on panorama aspect ratio
    position: 'absolute',
    top: 0,
  },
  hotspotsLayer: {
    position: 'absolute',
    top: 0,
    // Dimensions set dynamically to match panorama
  },
  panoramaImage: {
    width: '100%',
    height: '100%',
  },
  panoramaPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  placeholderText: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  placeholderSubtext: {
    ...typography.body,
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  hotspot: {
    position: 'absolute',
    zIndex: 10,
  },
  hotspotTouchArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Floating header overlay
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Floating footer overlay
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
  },
  gestureHints: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  hotspotsCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
  },
  // Quick Search Modal styles
  searchModal: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  searchTitle: {
    ...typography.h3,
    color: colors.light.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceSecondary,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.light.text,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  quickActionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    ...typography.bodySmall,
    color: colors.light.text,
    fontWeight: '500',
  },
  searchResultsList: {
    padding: spacing.md,
    paddingTop: 0,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  searchResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  searchResultAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    ...typography.label,
    color: colors.light.text,
  },
  searchResultPhone: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  searchEmptyText: {
    ...typography.body,
    color: colors.light.textMuted,
    marginTop: spacing.md,
  },
});
