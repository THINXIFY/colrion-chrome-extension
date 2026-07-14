import { create } from 'zustand';
import { ColorItem, Palette, RecentColor, AppSettings, ImportExportPayload, ExtractedColor } from '../types';
import { parseColor, normalizeHex } from '../lib/color';
import { storage } from '../lib/storage';
import { runDomExtract } from '../lib/extractScript';
import { clusterAndClassify } from '../lib/clustering';
import { generateDarkPalette, formatDarkModeExport, DarkModeColorMapping } from '../lib/darkModeGenerator';

export const cleanupRecentColors = (recent: RecentColor[], saved: ColorItem[]): RecentColor[] => {
  const now = Date.now();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  
  return recent.filter(rc => {
    const isSaved = saved.some(sc => normalizeHex(sc.hex).toLowerCase() === normalizeHex(rc.hex).toLowerCase());
    if (isSaved) {
      return (now - rc.pickedAt) < sixHoursMs;
    }
    return true;
  });
};

export const isRecentListEqual = (a: RecentColor[], b: RecentColor[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => 
    val.hex.toLowerCase() === b[index].hex.toLowerCase() && 
    val.pickedAt === b[index].pickedAt
  );
};

interface ColorStore {
  selectedColor: { hex: string; rgb: string; hsl: string } | null;
  savedColors: ColorItem[];
  recentColors: RecentColor[];
  palettes: Palette[];
  selectedPaletteId: string; // 'all' or specific palette ID
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  copySuccess: { [key: string]: boolean };
  
  // Phase 3 states
  settings: AppSettings;
  activeTab: 'colors' | 'generator' | 'extract' | 'settings' | 'darkmode' | 'help';
  favoritesOnly: boolean;
  activeWebTabId: number | null;
  activeWebTabUrl: string;
  
  // Extraction states
  extractedColors: ExtractedColor[];
  scanMode: 'viewport' | 'full';
  isScanning: boolean;
  hoverHighlightEnabled: boolean;
  activeHighlightedColor: string | null;
  extractedPreviewColors: string[];
  
  // Dark Mode Generator states
  darkModePalette: DarkModeColorMapping[];
  darkModeIntensity: 'soft' | 'deep';
  isPreviewingDarkMode: boolean;
  
  // Actions
  hydrate: () => Promise<void>;
  setSelectedColor: (hex: string | null) => void;
  saveSelectedColor: (paletteId?: string) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;
  clearError: () => void;
  triggerCopyFeedback: (key: string) => void;
  pickColor: () => Promise<void>;
  
  // Phase 2 Actions
  addRecentColor: (hex: string) => Promise<void>;
  clearRecentColors: () => Promise<void>;
  createPalette: (name: string) => Promise<boolean>;
  renamePalette: (id: string, name: string) => Promise<boolean>;
  deletePalette: (id: string) => Promise<void>;
  assignColorToPalette: (colorId: string, paletteId: string | undefined) => Promise<void>;
  updateColorMetadata: (colorId: string, label: string, note: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedPaletteId: (id: string) => void;
  exportColors: (format: 'text' | 'css' | 'json', paletteId?: string) => string;

  // Phase 3 Actions
  toggleFavoriteColor: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  importData: (payload: any) => Promise<{ success: boolean; error?: string }>;
  setActiveTab: (tab: 'colors' | 'generator' | 'extract' | 'settings' | 'darkmode' | 'help') => void;
  setFavoritesOnly: (favOnly: boolean) => void;
  reorderColors: (updatedColors: ColorItem[]) => Promise<void>;
  reorderPalettes: (updatedPalettes: Palette[]) => Promise<void>;

  // Phase 1 Improvements Actions
  deleteRecentColor: (hex: string) => Promise<void>;
  pickColorLocal: () => Promise<void>;
  
  // Extraction Actions
  setScanMode: (mode: 'viewport' | 'full') => void;
  setHoverHighlightEnabled: (enabled: boolean) => void;
  scanPage: () => Promise<void>;
  relabelColor: (hex: string, newLabel: string) => void;
  saveAllExtractedToPalette: (paletteName: string) => Promise<boolean>;
  highlightColorOnPage: (hex: string) => Promise<void>;
  clearHighlightsOnPage: () => Promise<void>;
  toggleLockColor: (hex: string) => void;
  reorderExtractedColors: (updatedColors: ExtractedColor[]) => void;
  toggleHighlightColorOnPage: (hex: string) => Promise<void>;
  quickScanSilent: () => Promise<void>;

  // Dark Mode Generator Actions
  generateDarkModePalette: () => void;
  setDarkModeIntensity: (intensity: 'soft' | 'deep') => void;
  toggleDarkModePreview: (forceState?: boolean) => Promise<void>;
  saveDarkModePalette: (name: string) => Promise<boolean>;
  updateDarkModeColor: (originalHex: string, newDarkHex: string) => void;
  toggleDarkModeColorLock: (originalHex: string) => void;
  applyDarkPalettePreset: (paletteId: string) => Promise<void>;
  exportDarkModePalette: (format: 'css' | 'tailwind' | 'json') => string;
}

export const useColorStore = create<ColorStore>((set, get) => ({
  selectedColor: null,
  savedColors: [],
  recentColors: [],
  palettes: [],
  selectedPaletteId: 'all',
  searchQuery: '',
  isLoading: true,
  error: null,
  copySuccess: {},

  // Phase 3 default states
  settings: {
    theme: 'dark',
    defaultCopyFormat: 'hex',
    enableAnimations: true,
    enableHistory: true,
    compactMode: false,
    reducedMotion: false,
    debugMode: false,
  },
  activeTab: 'colors',
  favoritesOnly: false,
  activeWebTabId: null,
  activeWebTabUrl: '',
  
  // Extraction defaults
  extractedColors: [],
  scanMode: 'viewport',
  isScanning: false,
  hoverHighlightEnabled: true,
  activeHighlightedColor: null,
  extractedPreviewColors: [],

  // Dark Mode Generator defaults
  darkModePalette: [],
  darkModeIntensity: 'soft',
  isPreviewingDarkMode: false,

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const saved = await storage.getSavedColors();
      const lastPicked = await storage.getLastPickedColor();
      const palettes = await storage.getPalettes();
      const settings = await storage.getSettings();
      
      let originalRecent: RecentColor[] = [];
      let recent: RecentColor[] = [];
      if (settings.enableHistory) {
        originalRecent = await storage.getRecentColors();
        recent = [...originalRecent];
      }

      // Enforce the 6-hour saved recents cleanups rule on load, but only write if changed
      recent = cleanupRecentColors(recent, saved);
      if (!isRecentListEqual(originalRecent, recent)) {
        await storage.setRecentColors(recent).catch(() => {});
      }

      // Sort saved colors: sortOrder first, then createdAt descending
      const sortedSaved = [...saved].sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Sort palettes: sortOrder first, then createdAt ascending
      const sortedPalettes = [...palettes].sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      if (lastPicked) {
        const parsed = parseColor(lastPicked.hex);
        if (parsed) {
          set({ selectedColor: parsed });
        }
      }

      // Query active tab info asynchronously during hydration to avoid doing it on click
      let activeWebTabId: number | null = null;
      let activeWebTabUrl: string = '';
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.id) {
            activeWebTabId = tab.id;
            activeWebTabUrl = tab.url || '';
          }
        } catch (e) {
          console.warn('Failed to query active tab details:', e);
        }
      }

      // Check if success banner needs to be shown (from a recent color pick)
      const showSuccess = await storage.getShowSuccessBanner();
      if (showSuccess) {
        // Trigger the copy feedback locally inside the popup
        get().triggerCopyFeedback('pick-success');
        storage.setShowSuccessBanner(false).catch(() => {});
      }

      set({ 
        savedColors: sortedSaved,
        palettes: sortedPalettes,
        recentColors: recent,
        settings,
        activeWebTabId,
        activeWebTabUrl
      });
      get().quickScanSilent().catch(() => {});
    } catch (err: any) {
      set({ error: 'Failed to hydrate extension state.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedColor: (hex) => {
    if (!hex) {
      set({ selectedColor: null });
      return;
    }
    const parsed = parseColor(hex);
    if (parsed) {
      set({ selectedColor: parsed, error: null });
    } else {
      set({ error: `Invalid color code: ${hex}` });
    }
  },

  saveSelectedColor: async (paletteId) => {
    const { selectedColor, savedColors, settings, recentColors } = get();
    if (!selectedColor) return;

    const normalizedHex = normalizeHex(selectedColor.hex).toLowerCase();
    const duplicate = savedColors.find(item => normalizeHex(item.hex).toLowerCase() === normalizedHex);

    let updatedColors: ColorItem[];
    const minSortOrder = savedColors.length > 0
      ? Math.min(...savedColors.map(c => c.sortOrder ?? 0))
      : 0;

    if (duplicate) {
      const filtered = savedColors.filter(item => item.id !== duplicate.id);
      const updatedItem: ColorItem = {
        ...duplicate,
        paletteId: paletteId !== undefined ? paletteId : duplicate.paletteId,
        createdAt: new Date().toISOString(),
        sortOrder: minSortOrder - 1
      };
      updatedColors = [updatedItem, ...filtered];
    } else {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newItem: ColorItem = {
        id,
        hex: selectedColor.hex,
        rgb: selectedColor.rgb,
        hsl: selectedColor.hsl,
        paletteId: paletteId,
        createdAt: new Date().toISOString(),
        sortOrder: minSortOrder - 1
      };
      updatedColors = [newItem, ...savedColors];
    }

    set({ savedColors: updatedColors });
    await storage.setSavedColors(updatedColors);
    
    if (settings.enableHistory) {
      // Re-evaluate recent list cleanup immediately after color is saved
      const cleanedRecent = cleanupRecentColors(recentColors, updatedColors);
      set({ recentColors: cleanedRecent });
      await storage.setRecentColors(cleanedRecent);
      
      await get().addRecentColor(selectedColor.hex);
    }
    
    get().triggerCopyFeedback('save-success');
  },

  deleteColor: async (id) => {
    const { savedColors, recentColors } = get();
    const updatedColors = savedColors.filter(item => item.id !== id);
    
    // When saved status is deleted, keep the color in recents permanently (since it is no longer saved)
    const cleanedRecent = cleanupRecentColors(recentColors, updatedColors);

    set({ savedColors: updatedColors, recentColors: cleanedRecent });
    await storage.setSavedColors(updatedColors);
    await storage.setRecentColors(cleanedRecent);
  },

  clearError: () => set({ error: null }),

  triggerCopyFeedback: (key) => {
    set((state) => ({
      copySuccess: { ...state.copySuccess, [key]: true }
    }));
    setTimeout(() => {
      set((state) => ({
        copySuccess: { ...state.copySuccess, [key]: false }
      }));
    }, 1500);
  },

  pickColor: async () => {
    set({ error: null, isLoading: true });
    await get().pickColorLocal();
  },

  pickColorLocal: async () => {
    if (!('EyeDropper' in window)) {
      set({ error: 'EyeDropper API is not supported in this browser. Please use Chrome or Edge.', isLoading: false });
      return;
    }

    const eyeDropper = new (window as any).EyeDropper();
    try {
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        const hex = result.sRGBHex;
        
        // 1. Update the local Zustand state synchronously so the UI updates immediately
        get().setSelectedColor(hex);
        
        // 2. Perform the clipboard write synchronously using fallback to ensure it completes before popup unload
        const currentSettings = get().settings;
        const parsed = parseColor(hex);
        if (parsed) {
          let textToCopy = parsed.hex;
          if (currentSettings.defaultCopyFormat === 'rgb') textToCopy = parsed.rgb;
          else if (currentSettings.defaultCopyFormat === 'hsl') textToCopy = parsed.hsl;

          try {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            get().triggerCopyFeedback('pick-success');
          } catch (clipErr) {
            console.error('Synchronous copy failed:', clipErr);
            // Async fallback in case execCommand is not available
            navigator.clipboard.writeText(textToCopy)
              .then(() => get().triggerCopyFeedback('pick-success'))
              .catch(() => {});
          }

          // 3. Inject a beautiful toast notification into the webpage DOM for instant visual feedback.
          // Wrapped in try-catch/promise catch so restricted pages (e.g. chrome://) don't break execution.
          const { activeWebTabId } = get();
          if (activeWebTabId && typeof chrome !== 'undefined' && chrome.scripting) {
            chrome.scripting.executeScript({
              target: { tabId: activeWebTabId },
              args: [textToCopy, hex],
              func: (colorTextArg, hexArg) => {
                const existingToast = document.getElementById('colrion-success-toast');
                if (existingToast) {
                  existingToast.remove();
                }

                const toast = document.createElement('div');
                toast.id = 'colrion-success-toast';
                
                Object.assign(toast.style, {
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  backgroundColor: 'rgba(24, 24, 27, 0.9)',
                  backdropFilter: 'blur(12px)',
                  webkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  zIndex: '999999999',
                  color: '#ffffff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: '0',
                  transform: 'translateY(12px)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: 'none',
                  userSelect: 'none'
                });

                const swatch = document.createElement('div');
                Object.assign(swatch.style, {
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: hexArg,
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.15)',
                  flexShrink: '0'
                });

                const textContainer = document.createElement('div');
                Object.assign(textContainer.style, {
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: '1.2'
                });

                const title = document.createElement('span');
                title.innerText = 'Copied to Clipboard';
                Object.assign(title.style, {
                  color: '#6366f1',
                  fontSize: '9px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                });

                const desc = document.createElement('span');
                desc.innerText = colorTextArg;
                Object.assign(desc.style, {
                  color: '#e4e4e7',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginTop: '1px'
                });

                textContainer.appendChild(title);
                textContainer.appendChild(desc);

                const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                checkIcon.setAttribute('width', '14');
                checkIcon.setAttribute('height', '14');
                checkIcon.setAttribute('viewBox', '0 0 24 24');
                checkIcon.setAttribute('fill', 'none');
                checkIcon.setAttribute('stroke', '#10b981');
                checkIcon.setAttribute('stroke-width', '3');
                checkIcon.setAttribute('stroke-linecap', 'round');
                checkIcon.setAttribute('stroke-linejoin', 'round');
                
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', '20 6 9 17 4 12');
                checkIcon.appendChild(polyline);

                toast.appendChild(swatch);
                toast.appendChild(textContainer);
                toast.appendChild(checkIcon);

                document.body.appendChild(toast);

                requestAnimationFrame(() => {
                  toast.style.opacity = '1';
                  toast.style.transform = 'translateY(0)';
                });

                setTimeout(() => {
                  toast.style.opacity = '0';
                  toast.style.transform = 'translateY(-8px)';
                  setTimeout(() => {
                    toast.remove();
                  }, 250);
                }, 2500);
              }
            }).catch((err) => {
              console.warn('Toast injection failed (likely restricted page):', err);
            });
          }
        }

        // 4. Save success flag to show banner inside popup next time it opens
        storage.setShowSuccessBanner(true).catch(() => {});

        // 5. Initiate storage writes asynchronously without awaiting them.
        storage.setLastPickedColor(hex).catch((err) => console.error('Failed to set last picked color:', err));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        set({ error: 'Color picker was blocked or failed to initialize.' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addRecentColor: async (hex) => {
    if (!get().settings.enableHistory) return;

    const parsed = parseColor(hex);
    if (!parsed) return;

    const cleanHex = normalizeHex(parsed.hex).toLowerCase();
    const { recentColors, savedColors } = get();

    // Deduplicate using normalized comparison
    const filtered = recentColors.filter(rc => normalizeHex(rc.hex).toLowerCase() !== cleanHex);
    let updated = [{ hex: parsed.hex, pickedAt: Date.now() }, ...filtered].slice(0, 10);
    
    // Apply cleanup rules
    updated = cleanupRecentColors(updated, savedColors);

    set({ recentColors: updated });
    await storage.setRecentColors(updated);
  },

  deleteRecentColor: async (hex) => {
    const { recentColors } = get();
    const cleanHex = normalizeHex(hex).toLowerCase();
    const updated = recentColors.filter(rc => normalizeHex(rc.hex).toLowerCase() !== cleanHex);
    set({ recentColors: updated });
    await storage.setRecentColors(updated);
  },

  clearRecentColors: async () => {
    set({ recentColors: [] });
    await storage.setRecentColors([]);
  },

  createPalette: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const { palettes } = get();
    const duplicate = palettes.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      set({ error: `Palette "${trimmed}" already exists.` });
      return false;
    }

    const minSortOrder = palettes.length > 0
      ? Math.max(...palettes.map(p => p.sortOrder ?? 0))
      : 0;

    const id = `palette-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newPalette: Palette = {
      id,
      name: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: minSortOrder + 1
    };

    const updated = [...palettes, newPalette];
    set({ palettes: updated, error: null });
    await storage.setPalettes(updated);
    return true;
  },

  renamePalette: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    const { palettes } = get();
    const duplicate = palettes.find(p => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      set({ error: `Another palette named "${trimmed}" already exists.` });
      return false;
    }

    const updated = palettes.map(p => {
      if (p.id === id) {
        return { ...p, name: trimmed, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    set({ palettes: updated, error: null });
    await storage.setPalettes(updated);
    return true;
  },

  deletePalette: async (id) => {
    const { palettes, savedColors, selectedPaletteId } = get();
    const targetPalette = palettes.find(p => p.id === id);
    const updatedPalettes = palettes.filter(p => p.id !== id);
    
    let updatedColors: ColorItem[];
    if (targetPalette?.isDarkMode) {
      // For dark mode palettes, delete all color items in it
      updatedColors = savedColors.filter(color => color.paletteId !== id);
    } else {
      // Standard behavior: clear the paletteId property, keep colors
      updatedColors = savedColors.map(color => {
        if (color.paletteId === id) {
          const { paletteId, ...rest } = color;
          return rest;
        }
        return color;
      });
    }

    const nextSelectedPaletteId = selectedPaletteId === id ? 'all' : selectedPaletteId;

    set({ 
      palettes: updatedPalettes,
      savedColors: updatedColors,
      selectedPaletteId: nextSelectedPaletteId
    });
    
    await storage.setPalettes(updatedPalettes);
    await storage.setSavedColors(updatedColors);
  },

  assignColorToPalette: async (colorId, paletteId) => {
    const { savedColors } = get();
    const updated = savedColors.map(color => {
      if (color.id === colorId) {
        return { 
          ...color, 
          paletteId,
          updatedAt: new Date().toISOString()
        };
      }
      return color;
    });

    set({ savedColors: updated });
    await storage.setSavedColors(updated);
  },

  updateColorMetadata: async (colorId, label, note) => {
    const { savedColors } = get();
    const updated = savedColors.map(color => {
      if (color.id === colorId) {
        return {
          ...color,
          label: label.trim() || undefined,
          note: note.trim() || undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return color;
    });

    set({ savedColors: updated });
    await storage.setSavedColors(updated);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedPaletteId: (id) => set({ selectedPaletteId: id }),

  exportColors: (format, paletteId) => {
    const { savedColors, palettes } = get();
    
    const targetColors = paletteId && paletteId !== 'all'
      ? savedColors.filter(c => c.paletteId === paletteId)
      : savedColors.filter(c => {
          if (c.paletteId) {
            const p = palettes.find(pal => pal.id === c.paletteId);
            return !p?.isDarkMode;
          }
          return true;
        });

    if (format === 'json') {
      const payload: ImportExportPayload = {
        version: 3,
        exportedAt: new Date().toISOString(),
        colors: targetColors,
        palettes: paletteId && paletteId !== 'all' 
          ? palettes.filter(p => p.id === paletteId) 
          : palettes.filter(p => !p.isDarkMode),
        settings: get().settings
      };
      return JSON.stringify(payload, null, 2);
    }

    if (format === 'css') {
      if (targetColors.length === 0) return '/* No colors saved */';
      const lines = targetColors.map((color, index) => {
        const cleanLabel = color.label
          ? color.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          : `color-${index + 1}`;
        return `  --cr-${cleanLabel}: ${color.hex};`;
      });
      return `:root {\n${lines.join('\n')}\n}`;
    }

    return targetColors.map(c => c.hex).join('\n');
  },

  // Phase 3 Actions
  toggleFavoriteColor: async (id) => {
    const { savedColors } = get();
    const updated = savedColors.map(color => {
      if (color.id === id) {
        return { 
          ...color, 
          favorite: !color.favorite,
          updatedAt: new Date().toISOString()
        };
      }
      return color;
    });

    set({ savedColors: updated });
    await storage.setSavedColors(updated);
  },

  updateSettings: async (newSettings) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    set({ settings: updated });
    await storage.setSettings(updated);
  },

  importData: async (payload) => {
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid file format. Import must be a JSON object.' };
    }
    
    let importedColors: ColorItem[] = [];
    let importedPalettes: Palette[] = [];
    let importedSettings: Partial<AppSettings> = {};

    if (Array.isArray(payload)) {
      importedColors = payload.filter((c: any) => c && typeof c === 'object' && typeof c.hex === 'string');
    } else if (payload.colors && Array.isArray(payload.colors)) {
      importedColors = payload.colors.filter((c: any) => c && typeof c === 'object' && typeof c.hex === 'string');
      if (payload.palettes && Array.isArray(payload.palettes)) {
        importedPalettes = payload.palettes.filter((p: any) => p && typeof p === 'object' && typeof p.name === 'string');
      }
      if (payload.settings && typeof payload.settings === 'object') {
        importedSettings = payload.settings;
      }
    } else {
      return { success: false, error: 'JSON does not match the Colrion data schema.' };
    }

    const { savedColors, palettes, settings } = get();
    
    const colorMap = new Map<string, ColorItem>();
    savedColors.forEach(c => colorMap.set(c.id, c));
    importedColors.forEach(c => {
      const id = c.id || `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      colorMap.set(id, {
        ...c,
        id,
        createdAt: c.createdAt || new Date().toISOString()
      });
    });
    const mergedColors = Array.from(colorMap.values());

    const paletteMap = new Map<string, Palette>();
    palettes.forEach(p => paletteMap.set(p.id, p));
    importedPalettes.forEach(p => {
      const id = p.id || `palette-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      paletteMap.set(id, {
        ...p,
        id,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
      });
    });
    const mergedPalettes = Array.from(paletteMap.values());

    const mergedSettings = { ...settings, ...importedSettings };

    // Run cleanup on recents based on the new imported/merged saved colors
    const cleanedRecent = cleanupRecentColors(get().recentColors, mergedColors);

    set({
      savedColors: mergedColors,
      palettes: mergedPalettes,
      settings: mergedSettings,
      recentColors: cleanedRecent
    });

    await storage.setSavedColors(mergedColors);
    await storage.setPalettes(mergedPalettes);
    await storage.setSettings(mergedSettings);
    await storage.setRecentColors(cleanedRecent);

    return { success: true };
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFavoritesOnly: (favOnly) => set({ favoritesOnly: favOnly }),

  reorderColors: async (updatedColors) => {
    const reordered = updatedColors.map((c, idx) => ({ ...c, sortOrder: idx }));
    set({ savedColors: reordered });
    await storage.setSavedColors(reordered);
  },

  reorderPalettes: async (updatedPalettes) => {
    const reordered = updatedPalettes.map((p, idx) => ({ ...p, sortOrder: idx }));
    set({ palettes: reordered });
    await storage.setPalettes(reordered);
  },
  
  // Extraction Implementations
  setScanMode: (mode) => set({ scanMode: mode }),
  
  setHoverHighlightEnabled: (enabled) => set({ hoverHighlightEnabled: enabled }),
  
  quickScanSilent: async () => {
    const { activeWebTabId } = get();
    if (typeof chrome === 'undefined' || !chrome.scripting) {
      // Mock top 3 colors
      set({ extractedPreviewColors: ['#7c3aed', '#0f172a', '#f8fafc'] });
      return;
    }
    if (!activeWebTabId) return;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        func: runDomExtract,
        args: ['quick', false]
      });
      if (results && results[0] && results[0].result) {
        const raw = results[0].result as any[];
        const clustered = clusterAndClassify(raw, []);
        set({ extractedPreviewColors: clustered.slice(0, 3).map(c => c.hex) });
      }
    } catch (e) {
      console.warn('Silent quick scan failed:', e);
    }
  },
  
  scanPage: async () => {
    set({ isScanning: true, error: null, activeHighlightedColor: null });
    const { activeWebTabId, scanMode, extractedColors } = get();
    
    // Filter currently locked colors to preserve them
    const lockedColors = extractedColors.filter(c => c.locked);
    
    // ----------------------------------------------------
    // PHASE 1: Quick Viewport Scan (Instant preview)
    // ----------------------------------------------------
    if (typeof chrome === 'undefined' || !chrome.scripting) {
      // Fallback Mock Quick Scan
      const mockRawQuick = [
        { hex: '#7c3aed', rgb: 'rgb(124, 58, 237)', weight: 1500, type: 'button', selector: 'button.btn-primary' },
        { hex: '#0f172a', rgb: 'rgb(15, 23, 42)', weight: 5000, type: 'background', selector: 'body' },
        { hex: '#f8fafc', rgb: 'rgb(248, 250, 252)', weight: 4500, type: 'text', selector: 'p' }
      ] as any[];
      const quickClustered = clusterAndClassify(mockRawQuick, lockedColors);
      set({ extractedColors: quickClustered });
      
      // Proceed to mock Phase 2 after a brief delay
      setTimeout(() => {
        const mockRawDeep = [
          { hex: '#7c3aed', rgb: 'rgb(124, 58, 237)', weight: 1500, type: 'button', selector: 'button.btn-primary' },
          { hex: '#4f46e5', rgb: 'rgb(79, 70, 229)', weight: 900, type: 'button', selector: 'a.nav-link' },
          { hex: '#0f172a', rgb: 'rgb(15, 23, 42)', weight: 5000, type: 'background', selector: 'body' },
          { hex: '#f8fafc', rgb: 'rgb(248, 250, 252)', weight: 4500, type: 'text', selector: 'p' },
          { hex: '#10b981', rgb: 'rgb(16, 185, 129)', weight: 1200, type: 'button', selector: 'span.badge' },
          { hex: '#e2e8f0', rgb: 'rgb(226, 232, 240)', weight: 2400, type: 'border', selector: 'div.card' },
          { hex: '#64748b', rgb: 'rgb(100, 116, 139)', weight: 3200, type: 'text', selector: 'span.muted' },
          { hex: '#f43f5e', rgb: 'rgb(244, 63, 94)', weight: 600, type: 'button', selector: 'button.delete' }
        ] as any[];
        const deepClustered = clusterAndClassify(mockRawDeep, lockedColors);
        set({ extractedColors: deepClustered, isScanning: false });
      }, 750);
      return;
    }
    
    if (!activeWebTabId) {
      set({ error: 'No active tab detected to scan.', isScanning: false });
      return;
    }
    
    // Phase 1 Chrome scripting execute (quick)
    try {
      const quickResults = await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        func: runDomExtract,
        args: ['quick', false]
      });
      if (quickResults && quickResults[0] && quickResults[0].result) {
        const rawQuick = quickResults[0].result as any[];
        const quickClustered = clusterAndClassify(rawQuick, lockedColors);
        set({ extractedColors: quickClustered });
      }
    } catch (e) {
      console.warn('Phase 1 quick scan failed:', e);
    }
    
    // ----------------------------------------------------
    // PHASE 2: Full/Viewport DOM Scan (Deep analysis)
    // ----------------------------------------------------
    try {
      const deepResults = await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        func: runDomExtract,
        args: [scanMode, get().settings.debugMode || false]
      });
      
      if (deepResults && deepResults[0] && deepResults[0].result) {
        const rawDeep = deepResults[0].result as any[];
        const deepClustered = clusterAndClassify(rawDeep, lockedColors);
        
        // Populate preview colors as a side-effect
        set({ 
          extractedColors: deepClustered, 
          extractedPreviewColors: deepClustered.slice(0, 3).map(c => c.hex),
          isScanning: false 
        });
      } else {
        set({ error: 'Failed to retrieve page colors.', isScanning: false });
      }
    } catch (err: any) {
      console.error('Phase 2 deep scan failed:', err);
      set({ 
        error: 'Unable to scan this page. Chrome extensions cannot run scripts on special tabs (e.g. chrome://, Chrome Web Store, or blank tabs).', 
        isScanning: false 
      });
    }
  },
  
  toggleLockColor: (hex) => {
    const { extractedColors } = get();
    const updated = extractedColors.map(c => 
      c.hex.toLowerCase() === hex.toLowerCase() 
        ? { ...c, locked: !c.locked, confidence: 'High' as const } 
        : c
    );
    set({ extractedColors: updated });
  },
  
  reorderExtractedColors: (updatedColors) => {
    const roles = ['Primary', 'Secondary', 'Accent', 'Background', 'Text'];
    const updated = updatedColors.map((c, idx) => {
      if (c.locked) return c; // Locked colors retain labels
      const newLabel = roles[idx] || `Accent ${idx - 1}`;
      return { ...c, label: newLabel };
    });
    set({ extractedColors: updated });
  },
  
  relabelColor: (hex, newLabel) => {
    const { extractedColors } = get();
    const updated = extractedColors.map(c => 
      c.hex.toLowerCase() === hex.toLowerCase() ? { ...c, label: newLabel } : c
    );
    set({ extractedColors: updated });
  },
  
  saveAllExtractedToPalette: async (paletteName) => {
    const { extractedColors, createPalette, savedColors } = get();
    if (extractedColors.length === 0) return false;
    
    const success = await createPalette(paletteName);
    if (!success) return false;
    
    // Refresh store state to fetch the newly created palette's ID
    const freshPalettes = get().palettes;
    const newPalette = freshPalettes.find(p => p.name.toLowerCase() === paletteName.trim().toLowerCase());
    if (!newPalette) return false;
    
    let tempSavedColors = [...savedColors];
    
    for (const ext of extractedColors) {
      const normalizedHex = ext.hex.toLowerCase();
      const duplicate = tempSavedColors.find(item => item.hex.toLowerCase() === normalizedHex);
      
      const minSortOrder = tempSavedColors.length > 0
        ? Math.min(...tempSavedColors.map(c => c.sortOrder ?? 0))
        : 0;
        
      if (duplicate) {
        const filtered = tempSavedColors.filter(item => item.id !== duplicate.id);
        const updatedItem: ColorItem = {
          ...duplicate,
          paletteId: newPalette.id,
          label: duplicate.label || ext.label,
          createdAt: new Date().toISOString(),
          sortOrder: minSortOrder - 1
        };
        tempSavedColors = [updatedItem, ...filtered];
      } else {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
        const newItem: ColorItem = {
          id,
          hex: ext.hex,
          rgb: ext.rgb,
          hsl: parseColor(ext.hex)?.hsl || ext.hex,
          paletteId: newPalette.id,
          label: ext.label,
          createdAt: new Date().toISOString(),
          sortOrder: minSortOrder - 1
        };
        tempSavedColors = [newItem, ...tempSavedColors];
      }
    }
    
    set({ savedColors: tempSavedColors });
    await storage.setSavedColors(tempSavedColors);
    return true;
  },
  
  highlightColorOnPage: async (hex) => {
    const { activeWebTabId, hoverHighlightEnabled, extractedColors, activeHighlightedColor } = get();
    // Prioritize clicked/toggled highlights over hover highlights
    if (activeHighlightedColor !== null) return;
    if (!activeWebTabId || !hoverHighlightEnabled || typeof chrome === 'undefined' || !chrome.scripting) return;
    
    const colorItem = extractedColors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (!colorItem || colorItem.selectors.length === 0) return;
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        args: [colorItem.selectors, colorItem.hex],
        func: (selectors, hexColor) => {
          // Remove any existing highlights
          const oldHighlights = document.querySelectorAll('.colrion-highlighted-el');
          for (const el of Array.from(oldHighlights)) {
            el.classList.remove('colrion-highlighted-el');
          }
          
          let styleEl = document.getElementById('colrion-highlight-style') as HTMLStyleElement;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'colrion-highlight-style';
            document.head.appendChild(styleEl);
          }
          
          styleEl.textContent = `
            @keyframes colrionPulse {
              0% { outline-color: ${hexColor}73; box-shadow: 0 0 0 2px ${hexColor}26; }
              50% { outline-color: ${hexColor}f2; box-shadow: 0 0 8px 3px ${hexColor}99; }
              100% { outline-color: ${hexColor}73; box-shadow: 0 0 0 2px ${hexColor}26; }
            }
            .colrion-highlighted-el {
              outline: 3px solid ${hexColor} !important;
              outline-offset: 1px !important;
              animation: colrionPulse 1.4s infinite ease-in-out !important;
              z-index: 2147483646 !important;
            }
          `;
          
          for (const s of selectors) {
            try {
              const cleanS = s.includes('::type::') ? s.split('::type::')[0] : s;
              const matches = document.querySelectorAll(cleanS);
              matches.forEach(el => el.classList.add('colrion-highlighted-el'));
            } catch {
              // ignore selector parsing issues
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to highlight elements:', err);
    }
  },
  
  toggleHighlightColorOnPage: async (hex) => {
    const { activeWebTabId, activeHighlightedColor, extractedColors, clearHighlightsOnPage } = get();
    if (!activeWebTabId || typeof chrome === 'undefined' || !chrome.scripting) return;
    
    // Toggle check
    if (activeHighlightedColor === hex) {
      set({ activeHighlightedColor: null });
      await clearHighlightsOnPage();
      return;
    }
    
    // Clear old highlights first
    set({ activeHighlightedColor: hex });
    
    const colorItem = extractedColors.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (!colorItem || colorItem.selectors.length === 0) return;
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        args: [colorItem.selectors, colorItem.hex],
        func: (selectors, hexColor) => {
          // Remove any existing highlights or dim overlays
          const oldHighlights = document.querySelectorAll('.colrion-highlighted-el');
          for (const el of Array.from(oldHighlights)) {
            const htmlEl = el as HTMLElement;
            htmlEl.classList.remove('colrion-highlighted-el');
            htmlEl.style.zIndex = '';
          }
          
          let styleEl = document.getElementById('colrion-highlight-style') as HTMLStyleElement;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'colrion-highlight-style';
            document.head.appendChild(styleEl);
          }
          
          styleEl.textContent = `
            @keyframes colrionPulse {
              0% { outline-color: ${hexColor}80; box-shadow: 0 0 0 2px ${hexColor}33; }
              50% { outline-color: ${hexColor}; box-shadow: 0 0 8px 3px ${hexColor}99; }
              100% { outline-color: ${hexColor}80; box-shadow: 0 0 0 2px ${hexColor}33; }
            }
            .colrion-highlighted-el {
              position: relative !important;
              outline: 4px solid ${hexColor} !important;
              outline-offset: 2px !important;
              animation: colrionPulse 1.4s infinite ease-in-out !important;
              z-index: 2147483645 !important;
            }
          `;
          
          // Inject Dim Overlay
          let overlay = document.getElementById('colrion-dim-overlay') as HTMLElement | null;
          if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.id = 'colrion-dim-overlay';
            Object.assign(newOverlay.style, {
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: '2147483640',
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease-in-out',
              opacity: '0'
            });
            document.body.appendChild(newOverlay);
            overlay = newOverlay;
          }
          
          if (overlay) {
            const finalOverlay = overlay;
            requestAnimationFrame(() => {
              finalOverlay.style.opacity = '1';
            });
          }
          
          for (const s of selectors) {
            try {
              const cleanS = s.includes('::type::') ? s.split('::type::')[0] : s;
              const matches = document.querySelectorAll(cleanS);
              matches.forEach(el => {
                el.classList.add('colrion-highlighted-el');
              });
            } catch {
              // ignore selector parsing issues
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to toggle click highlights:', err);
    }
  },
  
  clearHighlightsOnPage: async () => {
    const { activeWebTabId, activeHighlightedColor } = get();
    // Prioritize clicked/toggled highlights over hover clear events
    if (activeHighlightedColor !== null) return;
    if (!activeWebTabId || typeof chrome === 'undefined' || !chrome.scripting) return;
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        func: () => {
          const matches = document.querySelectorAll('.colrion-highlighted-el');
          matches.forEach(el => el.classList.remove('colrion-highlighted-el'));
          
          const overlay = document.getElementById('colrion-dim-overlay');
          if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
          }
          
          const styleEl = document.getElementById('colrion-highlight-style');
          if (styleEl) styleEl.remove();
        }
      });
    } catch (err) {
      console.warn('Failed to clear highlights:', err);
    }
  },

  generateDarkModePalette: () => {
    const { extractedColors, darkModeIntensity, darkModePalette } = get();
    if (extractedColors.length === 0) return;
    const mappedColors = generateDarkPalette(extractedColors, darkModeIntensity, darkModePalette);
    set({ darkModePalette: mappedColors });
  },

  setDarkModeIntensity: (intensity) => {
    set({ darkModeIntensity: intensity });
    get().generateDarkModePalette();
    if (get().isPreviewingDarkMode) {
      get().toggleDarkModePreview(true);
    }
  },

  updateDarkModeColor: (originalHex, newDarkHex) => {
    const { darkModePalette } = get();
    const updated = darkModePalette.map(m => 
      m.originalHex.toLowerCase() === originalHex.toLowerCase() 
        ? { ...m, darkHex: newDarkHex, locked: true } 
        : m
    );
    set({ darkModePalette: updated });
    if (get().isPreviewingDarkMode) {
      get().toggleDarkModePreview(true);
    }
  },

  toggleDarkModeColorLock: (originalHex) => {
    const { darkModePalette } = get();
    const updated = darkModePalette.map(m => 
      m.originalHex.toLowerCase() === originalHex.toLowerCase() 
        ? { ...m, locked: !m.locked } 
        : m
    );
    set({ darkModePalette: updated });
    if (get().isPreviewingDarkMode) {
      get().toggleDarkModePreview(true);
    }
  },

  exportDarkModePalette: (format) => {
    return formatDarkModeExport(get().darkModePalette, format);
  },

  saveDarkModePalette: async (paletteName) => {
    const { darkModePalette, savedColors, palettes, activeWebTabUrl } = get();
    if (darkModePalette.length === 0) return false;
    
    const trimmed = paletteName.trim();
    if (!trimmed) return false;

    // Check duplicate name
    const duplicate = palettes.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      set({ error: `Palette "${trimmed}" already exists.` });
      return false;
    }

    const minPaletteSort = palettes.length > 0
      ? Math.max(...palettes.map(p => p.sortOrder ?? 0))
      : 0;

    const paletteId = `palette-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    
    // Extract domain from activeWebTabUrl as source site name
    let sourceSite = '';
    if (activeWebTabUrl) {
      try {
        const urlObj = new URL(activeWebTabUrl);
        sourceSite = urlObj.hostname.replace('www.', '');
      } catch (e) {
        sourceSite = activeWebTabUrl;
      }
    }

    const newPalette: Palette = {
      id: paletteId,
      name: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: minPaletteSort + 1,
      isDarkMode: true,
      sourceUrl: sourceSite || undefined
    };

    const updatedPalettes = [...palettes, newPalette];
    let tempSavedColors = [...savedColors];
    
    for (const m of darkModePalette) {
      const minColorSort = tempSavedColors.length > 0
        ? Math.min(...tempSavedColors.map(c => c.sortOrder ?? 0))
        : 0;
        
      const colorId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
      const parsed = parseColor(m.darkHex);
      if (!parsed) continue;
      
      const newItem: ColorItem = {
        id: colorId,
        hex: m.darkHex,
        rgb: parsed.rgb,
        hsl: parsed.hsl,
        paletteId: paletteId,
        label: m.originalLabel, // Role label (e.g. "Primary", "Background")
        createdAt: new Date().toISOString(),
        sortOrder: minColorSort - 1,
        role: m.type, // Store color role
        originalHex: m.originalHex, // Store original mapped light color
        selectors: get().extractedColors.find(c => c.hex.toLowerCase() === m.originalHex.toLowerCase())?.selectors || []
      };
      tempSavedColors = [newItem, ...tempSavedColors];
    }
    
    set({ 
      palettes: updatedPalettes,
      savedColors: tempSavedColors,
      error: null 
    });
    
    await storage.setPalettes(updatedPalettes);
    await storage.setSavedColors(tempSavedColors);
    return true;
  },

  applyDarkPalettePreset: async (paletteId) => {
    const { savedColors, palettes } = get();
    const presetPalette = palettes.find(p => p.id === paletteId);
    if (!presetPalette) return;

    const presetColors = savedColors.filter(c => c.paletteId === paletteId);
    if (presetColors.length === 0) return;

    // Map saved preset colors back to active states
    const mappings = presetColors.map(c => ({
      originalHex: c.originalHex || c.hex,
      originalLabel: c.label || '',
      darkHex: c.hex,
      type: c.role || 'background',
      confidence: 'High' as const,
      locked: true
    }));

    const ext = presetColors.map(c => ({
      hex: c.originalHex || c.hex,
      rgb: parseColor(c.originalHex || c.hex)?.rgb || c.hex,
      weight: 1000,
      label: c.label || '',
      sourceTypes: [c.role || 'background'],
      selectors: c.selectors || [],
      confidence: 'High' as const,
      locked: true
    }));

    set({ 
      darkModePalette: mappings,
      extractedColors: ext
    });

    // Run preview injection
    await get().toggleDarkModePreview(true);
  },

  toggleDarkModePreview: async (forceState) => {
    const { activeWebTabId, isPreviewingDarkMode, darkModePalette } = get();
    if (!activeWebTabId || typeof chrome === 'undefined' || !chrome.scripting) return;
    
    // Check if we are clearing preview
    const shouldTurnOff = forceState !== undefined ? !forceState : isPreviewingDarkMode;
    
    if (shouldTurnOff) {
      set({ isPreviewingDarkMode: false });
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeWebTabId },
          func: () => {
            const override = document.getElementById('colrion-dark-mode-override');
            if (override) override.remove();
            
            const elements = document.querySelectorAll('*');
            for (const el of Array.from(elements)) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.removeProperty('background-color');
              htmlEl.style.removeProperty('color');
              htmlEl.style.removeProperty('border-color');
              htmlEl.style.removeProperty('background-image');
            }
          }
        });
      } catch (e) {
        console.warn('Failed to clear dark mode preview:', e);
      }
      return;
    }
    
    set({ isPreviewingDarkMode: true });
    
    let cssText = `
      img, svg, video {
        filter: brightness(0.85) contrast(1.1) !important;
      }
    `;
    const bgRules: string[] = [];
    const textRules: string[] = [];
    const borderRules: string[] = [];
    
    for (const m of darkModePalette) {
      const extColor = get().extractedColors.find(c => c.hex.toLowerCase() === m.originalHex.toLowerCase());
      if (!extColor) continue;
      
      for (const s of extColor.selectors) {
        const parts = s.split('::type::');
        const cssSelector = parts[0];
        const type = parts[1] || 'background';
        
        if (type === 'background' || type === 'button') {
          bgRules.push(`${cssSelector} { background-color: ${m.darkHex} !important; background-image: none !important; }`);
        } else if (type === 'text') {
          textRules.push(`${cssSelector} { color: ${m.darkHex} !important; }`);
        } else if (type === 'border') {
          borderRules.push(`${cssSelector} { border-color: ${m.darkHex} !important; }`);
        }
      }
    }
    
    cssText += bgRules.join('\n') + '\n' + textRules.join('\n') + '\n' + borderRules.join('\n');
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeWebTabId },
        args: [cssText, darkModePalette] as any,
        func: (css: string, colorMappings: any) => {
          const oldOverride = document.getElementById('colrion-dark-mode-override');
          if (oldOverride) oldOverride.remove();
          
          const styleEl = document.createElement('style');
          styleEl.id = 'colrion-dark-mode-override';
          styleEl.textContent = css;
          document.head.appendChild(styleEl);
          
          const elements = document.querySelectorAll('*');
          
          function matchColor(rgbStr: string | null, targetHex: string): boolean {
            if (!rgbStr) return false;
            const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return false;
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            
            const toHex = (c: number) => {
              const h = c.toString(16);
              return h.length === 1 ? '0' + h : h;
            };
            const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
            return hex === targetHex.toLowerCase();
          }
          
          for (const el of Array.from(elements)) {
            const htmlEl = el as HTMLElement;
            const inlineBg = htmlEl.style.backgroundColor;
            const inlineFg = htmlEl.style.color;
            const inlineBorder = htmlEl.style.borderColor;
            
            if (inlineBg) {
              const match = colorMappings.find((m: any) => matchColor(inlineBg, m.originalHex));
              if (match) htmlEl.style.setProperty('background-color', match.darkHex, 'important');
            }
            if (inlineFg) {
              const match = colorMappings.find((m: any) => matchColor(inlineFg, m.originalHex));
              if (match) htmlEl.style.setProperty('color', match.darkHex, 'important');
            }
            if (inlineBorder) {
              const match = colorMappings.find((m: any) => matchColor(inlineBorder, m.originalHex));
              if (match) htmlEl.style.setProperty('border-color', match.darkHex, 'important');
            }
            
            // OPTIMIZATION: Read from inline styles only, avoid window.getComputedStyle layout thrash
            const bgImg = htmlEl.style.backgroundImage || htmlEl.style.background;
            if (bgImg && bgImg !== 'none' && bgImg.includes('gradient')) {
              let newBgImg = bgImg;
              let updated = false;
              for (const m of colorMappings) {
                const origHex = m.originalHex.toLowerCase();
                const darkHex = m.darkHex;
                
                // Match 6-digit hex
                if (newBgImg.toLowerCase().includes(origHex)) {
                  newBgImg = newBgImg.replace(new RegExp(origHex, 'gi'), darkHex);
                  updated = true;
                }
                
                // Match 3-digit shorthand if applicable
                const matchShort = origHex.match(/^#([a-f\d])\1([a-f\d])\2([a-f\d])\3$/i);
                if (matchShort) {
                  const shortHex = `#${matchShort[1]}${matchShort[2]}${matchShort[3]}`;
                  const shortRegex = new RegExp(`${shortHex}(?![a-f\\d])`, 'gi');
                  if (newBgImg.toLowerCase().includes(shortHex)) {
                    newBgImg = newBgImg.replace(shortRegex, darkHex);
                    updated = true;
                  }
                }
                
                // Match RGB/RGBA formats
                const matchHex = origHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                if (matchHex) {
                  const r = parseInt(matchHex[1], 16);
                  const g = parseInt(matchHex[2], 16);
                  const b = parseInt(matchHex[3], 16);
                  
                  const rgbRegex = new RegExp(`rgba?\\(\\s*${r},\\s*${g},\\s*${b}(?:,\\s*([\\d.]+))?\\s*\\)`, 'gi');
                  const darkRgbMatch = darkHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                  
                  if (darkRgbMatch) {
                    const dr = parseInt(darkRgbMatch[1], 16);
                    const dg = parseInt(darkRgbMatch[2], 16);
                    const db = parseInt(darkRgbMatch[3], 16);
                    
                    newBgImg = newBgImg.replace(rgbRegex, (_match, alpha) => {
                      updated = true;
                      return alpha !== undefined 
                        ? `rgba(${dr}, ${dg}, ${db}, ${alpha})` 
                        : `rgb(${dr}, ${dg}, ${db})`;
                    });
                  }
                }
              }
              if (updated) {
                htmlEl.style.setProperty('background-image', newBgImg, 'important');
              }
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to apply dark mode preview:', err);
    }
  }
}));
