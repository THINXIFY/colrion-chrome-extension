export interface ColorItem {
  id: string;
  hex: string;
  rgb: string;
  hsl: string;
  createdAt: string;
  updatedAt?: string;
  label?: string;      // User-defined color label (e.g. "Primary blue")
  note?: string;       // Optional color note
  paletteId?: string;  // Assigned palette ID (undefined = unassigned)
  favorite?: boolean;  // [Phase 3] Favorite / pin state
  sortOrder?: number;  // [Phase 3] Sort order position
  role?: 'background' | 'text' | 'border' | 'button'; // Color role for dark mode re-apply
  originalHex?: string; // Mapped original light theme color
  selectors?: string[]; // CSS selectors matched during DOM extraction
}

export interface Palette {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;  // [Phase 3] Sort order position
  isDarkMode?: boolean; // Flag to identify generated dark mode palettes
  sourceUrl?: string; // Hostname source where palette was generated
}

export interface RecentColor {
  hex: string;
  pickedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultCopyFormat: 'hex' | 'rgb' | 'hsl';
  enableAnimations: boolean;
  enableHistory: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
  debugMode?: boolean;
}

export interface ImportExportPayload {
  version: number;
  exportedAt: string;
  colors: ColorItem[];
  palettes: Palette[];
  settings: AppSettings;
}

export interface ExtractedColor {
  hex: string;
  rgb: string;
  weight: number;
  label: string;
  sourceTypes: ('background' | 'text' | 'border' | 'button')[];
  selectors: string[]; // CSS selectors for elements that match this color
  locked?: boolean;
  confidence: 'High' | 'Medium' | 'Low';
  isMatched?: boolean;
}


