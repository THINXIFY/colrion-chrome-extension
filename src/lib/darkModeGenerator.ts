import { hexToRgb, hexToLab, labToHex } from './color';

export interface DarkModeColorMapping {
  originalHex: string;
  originalLabel: string;
  darkHex: string;
  type: 'background' | 'text' | 'border' | 'button';
  confidence: 'High' | 'Medium' | 'Low';
  locked?: boolean;
}

/**
 * Calculates relative luminance for WCAG contrast checks.
 */
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1.0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Transforms a single color to its dark mode equivalent using CIELAB perceptual scaling.
 */
export function transformColorToDark(
  hex: string, 
  label: string, 
  intensity: 'soft' | 'deep'
): { darkHex: string; type: 'background' | 'text' | 'border' | 'button' } {
  const lab = hexToLab(hex) || { l: 100, a: 0, b: 0 };
  
  let targetL = lab.l;
  let targetA = lab.a;
  let targetB = lab.b;
  
  const cleanLabel = label.toLowerCase();
  
  let type: 'background' | 'text' | 'border' | 'button' = 'background';
  
  if (cleanLabel.includes('background') || cleanLabel.includes('neutral light')) {
    type = 'background';
    
    // Light backgrounds (L > 80) mapping
    if (lab.l > 80) {
      targetL = intensity === 'deep' ? 4 : 10;
    } 
    // Mid backgrounds (L 50-80) mapping
    else if (lab.l > 50) {
      targetL = intensity === 'deep' ? 8 : 14;
    } 
    // Dark backgrounds (already dark) mapping
    else {
      targetL = Math.min(lab.l, intensity === 'deep' ? 6 : 12);
    }
    
    // Desaturate backgrounds to avoid colored glow
    targetA *= 0.3;
    targetB *= 0.3;
  } 
  else if (cleanLabel.includes('text') || cleanLabel.includes('neutral dark')) {
    type = 'text';
    
    // Dark text (L < 30) mapping to light text
    if (lab.l < 30) {
      targetL = intensity === 'deep' ? 95 : 88;
    } 
    // Light text mapping
    else if (lab.l < 70) {
      targetL = 82;
    } 
    // Already light text remains light
    else {
      targetL = Math.max(lab.l, 80);
    }
    
    targetA *= 0.8;
    targetB *= 0.8;
  } 
  else if (cleanLabel.includes('border') || cleanLabel.includes('divider')) {
    type = 'border';
    
    // Map borders to low-contrast dark grays
    targetL = intensity === 'deep' ? 16 : 22;
    targetA *= 0.4;
    targetB *= 0.4;
  } 
  else {
    // Primary, Accent, Brand, Links, buttons
    const isBrandOrInteractive = cleanLabel.includes('primary') || 
                                 cleanLabel.includes('secondary') || 
                                 cleanLabel.includes('accent') || 
                                 cleanLabel.includes('brand') || 
                                 cleanLabel.includes('link') || 
                                 cleanLabel.includes('button');
    type = isBrandOrInteractive ? 'button' : 'background';
    
    // Accents need to keep hue, but desaturate slightly to avoid neon text fatigue
    targetA *= 0.85;
    targetB *= 0.85;
    // Accents should be bright enough to be visible on dark bg
    targetL = Math.max(55, Math.min(75, lab.l));
  }
  
  const darkHex = labToHex(targetL, targetA, targetB);
  return { darkHex, type };
}

/**
 * Runs intelligent dark palette generation, enforcing WCAG contrast standards.
 */
export function generateDarkPalette(
  extractedColors: { hex: string; label: string; confidence: 'High' | 'Medium' | 'Low' }[],
  intensity: 'soft' | 'deep',
  existingMappings: DarkModeColorMapping[] = []
): DarkModeColorMapping[] {
  // 1. Transform each color
  const mappings: DarkModeColorMapping[] = extractedColors.map(color => {
    // Check if there is an existing mapping for this color that is locked
    const existing = existingMappings.find(m => m.originalHex.toLowerCase() === color.hex.toLowerCase());
    if (existing && existing.locked) {
      return {
        originalHex: color.hex,
        originalLabel: color.label,
        darkHex: existing.darkHex,
        type: existing.type,
        confidence: color.confidence,
        locked: true
      };
    }

    const { darkHex, type } = transformColorToDark(color.hex, color.label, intensity);
    return {
      originalHex: color.hex,
      originalLabel: color.label,
      darkHex,
      type,
      confidence: color.confidence,
      locked: false
    };
  });
  
  // 2. Identify dominant background color
  const bgMapping = mappings.find(m => m.type === 'background') || 
                    mappings.find(m => m.originalLabel.toLowerCase().includes('background')) ||
                    mappings[0];
  
  // 3. Contrast enforcement on all text and button colors relative to the dark background
  if (bgMapping) {
    const bgLab = hexToLab(bgMapping.darkHex) || { l: 0, a: 0, b: 0 };
    const bgIsDark = bgLab.l < 50;

    mappings.forEach(m => {
      // Do not auto-adjust colors that have been manually locked by the user
      if (m.locked) return;

      if (m.type === 'text' || m.type === 'button') {
        let currentRatio = getContrastRatio(m.darkHex, bgMapping.darkHex);
        
        // If contrast is below WCAG AA minimum 4.5:1, adjust lightness
        if (currentRatio < 4.5) {
          const lab = hexToLab(m.darkHex) || { l: 100, a: 0, b: 0 };
          let adjL = lab.l;
          let iterations = 0;
          
          if (bgIsDark) {
            // Background is dark, we need to increase lightness of text/button
            while (currentRatio < 4.5 && adjL < 98 && iterations < 30) {
              adjL += 2.0; // Increase lightness
              const newHex = labToHex(adjL, lab.a, lab.b);
              currentRatio = getContrastRatio(newHex, bgMapping.darkHex);
              m.darkHex = newHex;
              iterations++;
            }
          } else {
            // Background is light, we need to decrease lightness of text/button
            while (currentRatio < 4.5 && adjL > 2 && iterations < 30) {
              adjL -= 2.0; // Decrease lightness
              const newHex = labToHex(adjL, lab.a, lab.b);
              currentRatio = getContrastRatio(newHex, bgMapping.darkHex);
              m.darkHex = newHex;
              iterations++;
            }
          }
        }
      }
    });
  }
  
  return mappings;
}

/**
 * Formats dark mode tokens into target configurations.
 */
export function formatDarkModeExport(
  mappings: DarkModeColorMapping[], 
  format: 'css' | 'tailwind' | 'json'
): string {
  if (format === 'json') {
    const tokens: { [key: string]: string } = {};
    mappings.forEach((m) => {
      const cleanLabel = m.originalLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      tokens[`color-${cleanLabel}-original`] = m.originalHex;
      tokens[`color-${cleanLabel}-dark`] = m.darkHex;
    });
    return JSON.stringify({ version: 1, tokens }, null, 2);
  }
  
  if (format === 'tailwind') {
    const lines = mappings.map(m => {
      const cleanLabel = m.originalLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `      '${cleanLabel}': {\n        DEFAULT: '${m.darkHex}',\n        light: '${m.originalHex}',\n      },`;
    });
    return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join('\n')}\n      }\n    }\n  }\n}`;
  }
  
  // Default format: css
  const lines = mappings.map(m => {
    const cleanLabel = m.originalLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `  --cr-dark-${cleanLabel}: ${m.darkHex}; /* original: ${m.originalHex} */`;
  });
  return `:root.dark {\n${lines.join('\n')}\n}`;
}
