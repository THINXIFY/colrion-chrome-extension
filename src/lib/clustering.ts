import { hexToRgb, rgbToHsl, formatRgb } from './color';
import { ExtractedColor } from '../types';

interface RawColor {
  hex: string;
  rgb: string;
  weight: number;
  type: 'background' | 'text' | 'border' | 'button';
  selector: string;
}

interface ColorCluster {
  hex: string;
  rgb: string;
  totalWeight: number;
  typeWeights: {
    background: number;
    text: number;
    border: number;
    button: number;
  };
  hexFrequencies: { [hex: string]: number };
  selectors: string[];
  locked?: boolean;
  lockedLabel?: string;
}

function getRgbDistance(
  rgb1: { r: number; g: number; b: number }, 
  rgb2: { r: number; g: number; b: number }
): number {
  const rMean = (rgb1.r + rgb2.r) / 2;
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  return Math.sqrt(
    (2 + rMean / 256) * Math.pow(rDiff, 2) +
    4 * Math.pow(gDiff, 2) +
    (2 + (255 - rMean) / 256) * Math.pow(bDiff, 2)
  );
}

/**
 * Clusters close colors using leader-based distance thresholding,
 * preserving locked colors from prior scans, and calculates confidence ratings.
 */
export function clusterAndClassify(
  rawColors: RawColor[], 
  lockedColors: ExtractedColor[] = []
): ExtractedColor[] {
  const clusters: ColorCluster[] = [];
  const threshold = 40; // Perceptual RGB distance radius for merging similar colors and anti-aliased shades

  // 1. Initialize clusters with locked colors first to anchor the clustering centers
  for (const locked of lockedColors) {
    if (!locked.locked) continue;
    
    clusters.push({
      hex: locked.hex,
      rgb: locked.rgb,
      totalWeight: locked.weight || 1000, // Keep historical weight
      typeWeights: {
        background: locked.sourceTypes.includes('background') ? 500 : 0,
        text: locked.sourceTypes.includes('text') ? 500 : 0,
        border: locked.sourceTypes.includes('border') ? 200 : 0,
        button: locked.sourceTypes.includes('button') ? 500 : 0,
      },
      hexFrequencies: { [locked.hex]: 1000 },
      selectors: locked.selectors || [],
      locked: true,
      lockedLabel: locked.label
    });
  }

  // 2. Cluster raw colors. If visually close to a locked color, merge into it.
  for (const raw of rawColors) {
    const rgb1 = hexToRgb(raw.hex);
    if (!rgb1) continue;

    let merged = false;

    for (const cluster of clusters) {
      const rgb2 = hexToRgb(cluster.hex);
      if (!rgb2) continue;

      const dist = getRgbDistance(rgb1, rgb2);
      if (dist <= threshold) {
        // Merge item into this cluster
        cluster.totalWeight += raw.weight;
        cluster.typeWeights[raw.type] = (cluster.typeWeights[raw.type] || 0) + raw.weight;
        cluster.hexFrequencies[raw.hex] = (cluster.hexFrequencies[raw.hex] || 0) + raw.weight;
        
        // Accumulate unique CSS selectors (cap at 15 for safety)
        if (cluster.selectors.length < 15 && !cluster.selectors.includes(raw.selector)) {
          cluster.selectors.push(raw.selector);
        }
        
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        hex: raw.hex,
        rgb: raw.rgb,
        totalWeight: raw.weight,
        typeWeights: {
          background: raw.type === 'background' ? raw.weight : 0,
          text: raw.type === 'text' ? raw.weight : 0,
          border: raw.type === 'border' ? raw.weight : 0,
          button: raw.type === 'button' ? raw.weight : 0,
        },
        hexFrequencies: { [raw.hex]: raw.weight },
        selectors: [raw.selector],
      });
    }
  }

  // 3. Finalize cluster representatives (keep locked colors exactly as they were)
  const finalClusters = clusters.map(c => {
    if (c.locked) {
      return {
        hex: c.hex,
        rgb: c.rgb,
        totalWeight: c.totalWeight,
        typeWeights: c.typeWeights,
        selectors: c.selectors,
        locked: true,
        lockedLabel: c.lockedLabel
      };
    }

    let repHex = c.hex;
    let maxFreq = 0;
    
    for (const hex in c.hexFrequencies) {
      if (c.hexFrequencies[hex] > maxFreq) {
        maxFreq = c.hexFrequencies[hex];
        repHex = hex;
      }
    }

    const rgbObj = hexToRgb(repHex) || { r: 0, g: 0, b: 0 };
    
    return {
      hex: repHex,
      rgb: formatRgb(rgbObj.r, rgbObj.g, rgbObj.b),
      totalWeight: c.totalWeight,
      typeWeights: c.typeWeights,
      selectors: c.selectors,
      locked: false,
      lockedLabel: undefined
    };
  });

  // 4. Sort: Keep locked colors, then sort unlocked colors by weight descending
  const lockedGroup = finalClusters.filter(c => c.locked);
  const unlockedGroup = finalClusters.filter(c => !c.locked);
  
  unlockedGroup.sort((a, b) => b.totalWeight - a.totalWeight);

  // Filter out visual noise and extremely rare colors from unlocked colors
  const maxWeight = unlockedGroup.length > 0 ? Math.max(...unlockedGroup.map(c => c.totalWeight)) : 0;
  const filteredUnlocked = unlockedGroup.filter(c => {
    // Discard extremely low frequency colors (absolute noise check)
    if (c.totalWeight < 200) {
      // Keep only if it has interactive element button significance
      if (c.typeWeights.button > 50) return true;
      return false;
    }
    // Discard if it represents less than 1.5% of the most dominant color's weight
    if (maxWeight > 0 && c.totalWeight < maxWeight * 0.015) {
      // Keep only if it has interactive element significance
      if (c.typeWeights.button > 0) return true;
      return false;
    }
    return true;
  });

  // Combine them, keeping a dynamic limit of 5-10 colors
  const combined = [...lockedGroup, ...filteredUnlocked];
  const finalGroup = combined.length >= 5 ? combined : [...lockedGroup, ...unlockedGroup];

  const mergedClusters = finalGroup.slice(0, 16);

  // 5. Heuristic-based classification matching element tags and sizes
  
  // Find background candidate (highest background-tagged usage weight)
  let bgIdx = -1;
  let maxBgW = 0;
  mergedClusters.forEach((c, idx) => {
    if (c.typeWeights.background > maxBgW) {
      maxBgW = c.typeWeights.background;
      bgIdx = idx;
    }
  });

  // Find text candidate (highest text-tagged weight, excluding background index)
  let textIdx = -1;
  let maxTextW = 0;
  mergedClusters.forEach((c, idx) => {
    if (idx === bgIdx) return;
    if (c.typeWeights.text > maxTextW) {
      maxTextW = c.typeWeights.text;
      textIdx = idx;
    }
  });

  // Find accent candidate (highest interactive button or border weights)
  let accentIdx = -1;
  let maxAccentW = 0;
  mergedClusters.forEach((c, idx) => {
    if (idx === bgIdx || idx === textIdx) return;
    const accentW = c.typeWeights.button * 2.5 + c.typeWeights.border * 1.2;
    if (accentW > maxAccentW) {
      maxAccentW = accentW;
      accentIdx = idx;
    }
  });

  // 6. Map clusters to final label categories and calculate confidence
  const extractedColors: ExtractedColor[] = mergedClusters.map((c, idx) => {
    // 6a. Restore lock details if present
    if (c.locked && c.lockedLabel) {
      const sourceTypes: ('background' | 'text' | 'border' | 'button')[] = [];
      if (c.typeWeights.background > 0) sourceTypes.push('background');
      if (c.typeWeights.text > 0) sourceTypes.push('text');
      if (c.typeWeights.border > 0) sourceTypes.push('border');
      if (c.typeWeights.button > 0) sourceTypes.push('button');

      return {
        hex: c.hex,
        rgb: c.rgb,
        weight: c.totalWeight,
        label: c.lockedLabel,
        sourceTypes,
        selectors: c.selectors,
        locked: true,
        confidence: 'High', // Locked colors are high confidence by definition
        isMatched: true
      };
    }

    let label = 'Secondary';
    const sourceTypes: ('background' | 'text' | 'border' | 'button')[] = [];
    if (c.typeWeights.background > 0) sourceTypes.push('background');
    if (c.typeWeights.text > 0) sourceTypes.push('text');
    if (c.typeWeights.border > 0) sourceTypes.push('border');
    if (c.typeWeights.button > 0) sourceTypes.push('button');

    if (idx === bgIdx) {
      label = 'Background';
    } else if (idx === textIdx) {
      label = 'Text';
    } else if (idx === accentIdx) {
      label = 'Accent';
    } else if (idx === 0) {
      label = 'Primary';
    } else if (idx === 1) {
      label = 'Secondary';
    } else {
      const rgb = hexToRgb(c.hex);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        if (hsl.l > 85 && hsl.s < 10) {
          label = 'Neutral Light';
        } else if (hsl.l < 15 && hsl.s < 10) {
          label = 'Neutral Dark';
        } else {
          label = `Accent ${idx - 1}`;
        }
      } else {
        label = `Accent ${idx - 1}`;
      }
    }

    // 6b. Determine confidence levels
    // High: heavy button presence, overall weight > 2500, or main background/text
    // Medium: overall weight between 600 and 2500, or moderate button/text presence
    // Low: weight < 600 and primarily border elements
    let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
    if (c.locked) {
      confidence = 'High';
    } else if (c.typeWeights.button > 150 || c.totalWeight > 2500 || ['Background', 'Text', 'Primary'].includes(label)) {
      confidence = 'High';
    } else if (c.totalWeight < 400 && c.typeWeights.border > c.totalWeight * 0.7 && c.typeWeights.button === 0) {
      confidence = 'Low';
    }

    const isMainRole = ['Primary', 'Secondary', 'Accent', 'Background', 'Text', 'Neutral Light', 'Neutral Dark'].includes(label);
    const isMatched = !!c.locked || (isMainRole && confidence !== 'Low');

    return {
      hex: c.hex,
      rgb: c.rgb,
      weight: c.totalWeight,
      label,
      sourceTypes,
      selectors: c.selectors,
      locked: false,
      confidence,
      isMatched
    };
  });

  // Guarantee at least one "Primary" color exists
  const hasPrimary = extractedColors.some(c => c.label === 'Primary');
  if (!hasPrimary && extractedColors.length > 0) {
    const firstAccentOrSec = extractedColors.find(c => c.label !== 'Background' && c.label !== 'Text');
    if (firstAccentOrSec) {
      firstAccentOrSec.label = 'Primary';
    } else {
      extractedColors[0].label = 'Primary';
    }
  }

  return extractedColors;
}
