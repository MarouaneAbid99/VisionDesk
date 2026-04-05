export const colors = {
  light: {
    // Primary - Deep Indigo
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    primaryLight: '#818cf8',
    primaryBg: '#eef2ff',
    
    // Secondary - Purple
    secondary: '#7c3aed',
    secondaryDark: '#6d28d9',
    secondaryLight: '#a78bfa',
    secondaryBg: '#f5f3ff',
    
    // Backgrounds
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    surfaceElevated: '#ffffff',
    
    // Text
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textInverse: '#ffffff',
    
    // Neutral scale (UI chrome)
    neutral50: '#f8fafc',
    neutral100: '#f1f5f9',
    neutral200: '#e2e8f0',
    neutral400: '#94a3b8',
    neutral600: '#475569',
    neutral900: '#0f172a',

    // Borders
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderFocus: '#4f46e5',
    
    // Semantic Colors
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorLight: '#fecaca',
    success: '#16a34a',
    successBg: '#f0fdf4',
    successLight: '#bbf7d0',
    warning: '#d97706',
    warningBg: '#fffbeb',
    warningLight: '#fde68a',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    infoLight: '#bae6fd',
    
    // Gradients (start/end colors)
    gradientPrimary: ['#4f46e5', '#7c3aed'],
    gradientSuccess: ['#16a34a', '#22c55e'],
    gradientWarning: ['#d97706', '#f59e0b'],
    gradientDanger: ['#dc2626', '#ef4444'],
  },
  dark: {
    primary: '#60a5fa',
    primaryDark: '#3b82f6',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
};

export const statusColors = {
  order: {
    DRAFT: { bg: '#f1f5f9', text: '#64748b' },
    CONFIRMED: { bg: '#eef2ff', text: '#4338ca' },
    IN_ATELIER: { bg: '#fef3c7', text: '#d97706' },
    READY: { bg: '#dcfce7', text: '#16a34a' },
    READY_FOR_PICKUP: { bg: '#dcfce7', text: '#16a34a' },
    PICKED_UP: { bg: '#dbeafe', text: '#2563eb' },
    DELIVERED: { bg: '#e0e7ff', text: '#4f46e5' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  },
  atelier: {
    PENDING: { bg: '#f1f5f9', text: '#64748b' },
    IN_PROGRESS: { bg: '#fef3c7', text: '#d97706' },
    READY: { bg: '#dcfce7', text: '#16a34a' },
  },
  appointment: {
    SCHEDULED: { bg: '#dbeafe', text: '#2563eb' },
    CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
    COMPLETED: { bg: '#f1f5f9', text: '#64748b' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  },
};

export type ColorScheme = typeof colors.light;
