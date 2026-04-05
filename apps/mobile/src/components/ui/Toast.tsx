import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const toastConfig = {
  success: {
    icon: 'checkmark-circle',
    bg: '#f0fdf4',
    border: '#86efac',
    text: '#166534',
    iconColor: '#16a34a',
  },
  error: {
    icon: 'close-circle',
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
    iconColor: '#dc2626',
  },
  info: {
    icon: 'information-circle',
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
    iconColor: '#2563eb',
  },
  warning: {
    icon: 'warning',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
    iconColor: '#d97706',
  },
};

export function Toast({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onHide,
  action,
}: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const config = toastConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={22} color={config.iconColor} />
      <Text style={[styles.message, { color: config.text }]} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <Pressable 
          onPress={() => {
            action.onPress();
            hideToast();
          }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.actionText, { color: config.iconColor }]}>
            {action.label}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={18} color={config.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    zIndex: 9999,
    ...shadows.lg,
  },
  message: {
    ...typography.body,
    flex: 1,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.label,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing.xs,
  },
});
