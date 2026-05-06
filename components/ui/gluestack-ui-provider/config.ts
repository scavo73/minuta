'use client';

import { vars } from 'nativewind';

export const config = {
  light: vars({
    '--color-primary-500': '56 189 248',
    '--color-background-0': '248 248 251',
    '--color-background-50': '255 255 255',
    '--color-typography-900': '17 24 39',
    '--color-typography-500': '107 114 128',
    '--color-outline-200': '229 231 235',
  }),
  dark: vars({
    '--color-primary-500': '56 189 248',
    '--color-background-0': '17 24 39',
    '--color-background-50': '31 41 55',
    '--color-typography-900': '249 250 251',
    '--color-typography-500': '156 163 175',
    '--color-outline-200': '55 65 81',
  }),
};
