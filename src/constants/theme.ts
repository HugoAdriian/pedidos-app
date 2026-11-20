/**
 * Colores de la app. `Colors` cambia según el modo claro/oscuro del teléfono;
 * `Brand` son colores de relleno (botones, etiquetas) con texto blanco encima.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2B1D14',
    background: '#FBF6EF',
    backgroundElement: '#F4EADC',
    backgroundSelected: '#E9DCC8',
    textSecondary: '#6B5645',
  },
  dark: {
    text: '#F5EBDD',
    background: '#1A130E',
    backgroundElement: '#2A2018',
    backgroundSelected: '#3A2D22',
    textSecondary: '#C2AE9A',
  },
} as const;

export const Brand = {
  primary: '#6F4E37', // café: acciones principales
  accent: '#AD5F29', // caramelo: acciones secundarias
  success: '#3E7B3A', // verde: agregar, abierto, listo
  danger: '#B3402D', // rojo: eliminar, cancelar, errores
  info: '#3B6E8F', // azul grisáceo: informativo
  neutral: '#7A6A5C', // neutro: pendiente, controles
  neutralDark: '#5E5248', // neutro oscuro: entregado
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
