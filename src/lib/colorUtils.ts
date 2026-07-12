import { hexToRgb, rgbToHsl } from './color';

/**
 * Converts HSL back to a Hex string.
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Helper to parse Hex to HSL numbers.
 */
export function hexToHslNumbers(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export interface ColorSuggestion {
  hex: string;
  name: string;
}

export interface GradientSuggestion {
  name: string;
  color1: string;
  color2: string;
  css: string;
}

/**
 * Generates shades (lighter and darker variants).
 */
export function getShades(hex: string): ColorSuggestion[] {
  const hsl = hexToHslNumbers(hex);
  if (!hsl) return [];

  const { h, s, l } = hsl;
  const shades: ColorSuggestion[] = [];

  // 3 Lighter shades
  shades.push({ hex: hslToHex(h, s, l + (100 - l) * 0.35), name: 'Light Tint' });
  shades.push({ hex: hslToHex(h, s, l + (100 - l) * 0.65), name: 'Soft Tint' });
  shades.push({ hex: hslToHex(h, s, l + (100 - l) * 0.85), name: 'Pale Tint' });

  // Original Color
  shades.push({ hex: hex.toLowerCase(), name: 'Base' });

  // 3 Darker shades
  shades.push({ hex: hslToHex(h, s, l * 0.75), name: 'Mid Shade' });
  shades.push({ hex: hslToHex(h, s, l * 0.5), name: 'Deep Shade' });
  shades.push({ hex: hslToHex(h, s, l * 0.25), name: 'Dark Shade' });

  // Filter unique values and sort by lightness descending
  const seen = new Set<string>();
  return shades.filter(item => {
    const norm = item.hex.toLowerCase();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

/**
 * Generates color harmonies.
 */
export function getHarmonies(hex: string): {
  complementary: ColorSuggestion[];
  analogous: ColorSuggestion[];
  monochromatic: ColorSuggestion[];
} {
  const hsl = hexToHslNumbers(hex);
  if (!hsl) {
    return { complementary: [], analogous: [], monochromatic: [] };
  }

  const { h, s, l } = hsl;

  // 1. Complementary
  const compHex = hslToHex((h + 180) % 360, s, l);
  const complementary = [
    { hex: hex.toLowerCase(), name: 'Base' },
    { hex: compHex, name: 'Complementary' }
  ];

  // 2. Analogous
  const analogous = [
    { hex: hslToHex((h - 30 + 360) % 360, s, l), name: 'Analogous Left' },
    { hex: hex.toLowerCase(), name: 'Base' },
    { hex: hslToHex((h + 30) % 360, s, l), name: 'Analogous Right' }
  ];

  // 3. Monochromatic
  const monochromatic = [
    { hex: hslToHex(h, Math.max(10, s - 30), Math.min(95, l + 15)), name: 'Mono Soft' },
    { hex: hslToHex(h, Math.max(10, s - 15), Math.max(10, l - 15)), name: 'Mono Dark' },
    { hex: hex.toLowerCase(), name: 'Base' },
    { hex: hslToHex(h, Math.min(100, s + 15), Math.max(10, l - 30)), name: 'Mono Contrast' },
    { hex: hslToHex(h, Math.max(10, s - 40), Math.min(95, l + 30)), name: 'Mono Light' }
  ];

  return {
    complementary,
    analogous,
    monochromatic: monochromatic.filter((item, idx, self) => 
      self.findIndex(t => t.hex.toLowerCase() === item.hex.toLowerCase()) === idx
    )
  };
}

/**
 * Generates gradient suggestions.
 */
export function getGradients(hex: string): GradientSuggestion[] {
  const hsl = hexToHslNumbers(hex);
  if (!hsl) return [];

  const { h, s, l } = hsl;
  const c1 = hex.toLowerCase();

  // Create different pairing variants
  const pairings = [
    { name: 'Sunset Aura', color2: hslToHex((h + 40) % 360, s, Math.min(90, l + 10)) },
    { name: 'Complementary Blend', color2: hslToHex((h + 180) % 360, s, l) },
    { name: 'Ocean Mist', color2: hslToHex((h - 60 + 360) % 360, Math.max(15, s - 10), Math.min(90, l + 20)) },
    { name: 'Monochromatic Flow', color2: hslToHex(h, Math.max(10, s - 40), Math.min(95, l + 25)) },
    { name: 'Neon Pop', color2: hslToHex((h + 120) % 360, Math.min(100, s + 20), Math.min(85, l + 5)) },
    { name: 'Deep Eclipse', color2: hslToHex(h, s, Math.max(5, l - 35)) }
  ];

  return pairings.map(p => ({
    name: p.name,
    color1: c1,
    color2: p.color2,
    css: `linear-gradient(135deg, ${c1} 0%, ${p.color2} 100%)`
  }));
}
