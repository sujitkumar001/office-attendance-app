export default {
  // Primary Colors - Modern Blue Gradient
  primary: '#5B7FFF',
  primaryDark: '#3B5CDB',
  primaryLight: '#7B9AFF',
  primaryGradientStart: '#5B7FFF',
  primaryGradientEnd: '#3B5CDB',
  
  // Secondary Colors - Soft Purple
  secondary: '#8B5CF6',
  secondaryDark: '#7C3AED',
  secondaryLight: '#A78BFA',
  
  // Accent Colors
  accent: '#FFC107',
  accentLight: '#FFD54F',
  
  // Status Colors
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Dark Theme Colors
  dark: '#1E2139',
  darkSecondary: '#2D3250',
  darkTertiary: '#383E5C',
  
  // Background Colors
  background: '#F8F9FF',
  backgroundDark: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceLight: '#FAFBFF',
  
  // Text Colors
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textDisabled: '#D1D5DB',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Glass Morphism
  glass: 'rgba(255, 255, 255, 0.25)',
  glassDark: 'rgba(255, 255, 255, 0.1)',
  
  // Gradients (for LinearGradient)
  gradients: {
    primary: ['#5B7FFF', '#3B5CDB'],
    secondary: ['#8B5CF6', '#7C3AED'],
    success: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    info: ['#3B82F6', '#2563EB'],      // Fixed: Added for Date icons
    warning: ['#F59E0B', '#D97706'],   // Fixed: Added for Priority icons
    dark: ['#2D3250', '#1E2139'],
    light: ['#FFFFFF', '#F8F9FF'],
    sunset: ['#FF6B9D', '#FFC107'],
    ocean: ['#06B6D4', '#3B82F6'],
    purple: ['#A78BFA', '#8B5CF6'],
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    primary: {
      shadowColor: '#5B7FFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};