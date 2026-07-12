/**
 * Color utility helpers for Colrion.
 * Handles hex validation, normalization, conversions, and formatting.
 */

/**
 * Checks if a string is a valid hex color code (e.g. #3b82f6 or #fff).
 */
export function isValidHex(hex: string): boolean {
  return /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(hex.trim());
}

/**
 * Normalizes a hex color string to be lowercase, start with '#',
 * and expands 3-character shorthand to 6-character format.
 */
export function normalizeHex(hex: string): string {
  let cleaned = hex.trim().replace(/^#/, '').toLowerCase();
  
  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  
  return `#${cleaned}`;
}

/**
 * Converts a hex string into RGB values.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHex(hex)) return null;
  
  const normalized = normalizeHex(hex);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts RGB values (0-255) into HSL values.
 * Hue: 0-360, Saturation: 0-100%, Lightness: 0-100%.
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Formats RGB values into a standard css string.
 */
export function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Formats HSL values into a standard css string.
 */
export function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Fully parses a hex input string, returns normalized hex, rgb, and hsl strings.
 * Returns null if the color code is invalid.
 */
export function parseColor(hexInput: string): { hex: string; rgb: string; hsl: string } | null {
  if (!isValidHex(hexInput)) return null;

  const hex = normalizeHex(hexInput);
  const rgbObj = hexToRgb(hex);
  if (!rgbObj) return null;

  const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
  
  return {
    hex,
    rgb: formatRgb(rgbObj.r, rgbObj.g, rgbObj.b),
    hsl: formatHsl(hslObj.h, hslObj.s, hslObj.l)
  };
}

/**
 * Converts HSL values to a HEX color string.
 * Hue: 0-360, Saturation: 0-100, Lightness: 0-100.
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h <= 360) {
    r = c; g = 0; b = x;
  }

  const r255 = Math.min(255, Math.max(0, Math.round((r + m) * 255)));
  const g255 = Math.min(255, Math.max(0, Math.round((g + m) * 255)));
  const b255 = Math.min(255, Math.max(0, Math.round((b + m) * 255)));

  const hexPart = (val: number) => {
    const hex = val.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${hexPart(r255)}${hexPart(g255)}${hexPart(b255)}`;
}

/**
 * Classifies a color into a human-readable shade description.
 */
export function getColorShadeDescription(hex: string): string {
  const rgbObj = hexToRgb(hex);
  if (!rgbObj) return 'Unknown Color';
  const { h, s, l } = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);

  if (l < 10) return 'Almost Black';
  if (l > 90) return 'Almost White';
  if (s < 12) {
    if (l < 30) return 'Dark Gray';
    if (l < 70) return 'Medium Gray';
    return 'Light Gray';
  }

  let lightnessPrefix = '';
  if (l < 30) lightnessPrefix = 'Deep ';
  else if (l < 45) lightnessPrefix = 'Dark ';
  else if (l > 75) lightnessPrefix = 'Pale ';
  else if (l > 60) lightnessPrefix = 'Light ';

  let saturationPrefix = '';
  if (s < 35) saturationPrefix = 'Muted ';
  else if (s > 80) saturationPrefix = 'Vivid ';

  let hueName = 'Red';
  if (h >= 15 && h < 45) hueName = 'Orange';
  else if (h >= 45 && h < 70) hueName = 'Yellow';
  else if (h >= 70 && h < 155) hueName = 'Green';
  else if (h >= 155 && h < 195) hueName = 'Teal';
  else if (h >= 195 && h < 250) hueName = 'Blue';
  else if (h >= 250 && h < 285) hueName = 'Purple';
  else if (h >= 285 && h < 330) hueName = 'Magenta/Pink';

  return `${lightnessPrefix}${saturationPrefix}${hueName}`;
}

/**
 * Classifies a color lightness into a clean tone category (e.g. very light, light, medium, dark, deep).
 */
export function getColorTone(hex: string): string {
  const rgbObj = hexToRgb(hex);
  if (!rgbObj) return 'Medium';
  const { l } = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
  
  if (l < 12) return 'Deep';
  if (l < 35) return 'Dark';
  if (l < 65) return 'Medium';
  if (l < 85) return 'Light';
  return 'Very Light';
}

/**
 * Converts RGB to XYZ color space.
 */
export function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  let rL = r / 255;
  let gL = g / 255;
  let bL = b / 255;

  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

  rL *= 100;
  gL *= 100;
  bL *= 100;

  const x = rL * 0.4124 + gL * 0.3576 + bL * 0.1805;
  const y = rL * 0.2126 + gL * 0.7152 + bL * 0.0722;
  const z = rL * 0.0193 + gL * 0.1192 + bL * 0.9505;

  return { x, y, z };
}

/**
 * Converts XYZ to CIELAB color space.
 */
export function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  let xN = x / 95.047;
  let yN = y / 100.0;
  let zN = z / 108.883;

  xN = xN > 0.008856 ? Math.pow(xN, 1 / 3) : 7.787 * xN + 16 / 116;
  yN = yN > 0.008856 ? Math.pow(yN, 1 / 3) : 7.787 * yN + 16 / 116;
  zN = zN > 0.008856 ? Math.pow(zN, 1 / 3) : 7.787 * zN + 16 / 116;

  const l = 116 * yN - 16;
  const a = 500 * (xN - yN);
  const b = 200 * (yN - zN);

  return { l, a, b };
}

/**
 * Converts CIELAB to XYZ color space.
 */
export function labToXyz(l: number, a: number, b: number): { x: number; y: number; z: number } {
  let yN = (l + 16) / 116;
  let xN = a / 500 + yN;
  let zN = yN - b / 200;

  const yN3 = Math.pow(yN, 3);
  const xN3 = Math.pow(xN, 3);
  const zN3 = Math.pow(zN, 3);

  yN = yN3 > 0.008856 ? yN3 : (yN - 16 / 116) / 7.787;
  xN = xN3 > 0.008856 ? xN3 : (xN - 16 / 116) / 7.787;
  zN = zN3 > 0.008856 ? zN3 : (zN - 16 / 116) / 7.787;

  const x = xN * 95.047;
  const y = yN * 100.0;
  const z = zN * 108.883;

  return { x, y, z };
}

/**
 * Converts XYZ to RGB.
 */
export function xyzToRgb(x: number, y: number, z: number): { r: number; g: number; b: number } {
  const xL = x / 100;
  const yL = y / 100;
  const zL = z / 100;

  let rL = xL * 3.2406 + yL * -1.5372 + zL * -0.4986;
  let gL = xL * -0.9689 + yL * 1.8758 + zL * 0.0415;
  let bL = xL * 0.0557 + yL * -0.2040 + zL * 1.0570;

  rL = rL > 0.0031308 ? 1.055 * Math.pow(rL, 1 / 2.4) - 0.055 : 12.92 * rL;
  gL = gL > 0.0031308 ? 1.055 * Math.pow(gL, 1 / 2.4) - 0.055 : 12.92 * gL;
  bL = bL > 0.0031308 ? 1.055 * Math.pow(bL, 1 / 2.4) - 0.055 : 12.92 * bL;

  const r = Math.min(255, Math.max(0, Math.round(rL * 255)));
  const g = Math.min(255, Math.max(0, Math.round(gL * 255)));
  const b = Math.min(255, Math.max(0, Math.round(bL * 255)));

  return { r, g, b };
}

/**
 * Converts a hex color string to LAB.
 */
export function hexToLab(hex: string): { l: number; a: number; b: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Converts LAB values to hex.
 */
export function labToHex(l: number, a: number, b: number): string {
  const xyz = labToXyz(l, a, b);
  const rgb = xyzToRgb(xyz.x, xyz.y, xyz.z);
  
  const toHexPart = (c: number) => {
    const h = c.toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  
  return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}
