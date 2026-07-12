import { ColorItem, Palette, RecentColor, AppSettings } from '../types';

// Check if the Chrome extension API is available
const IS_EXTENSION = 
  typeof chrome !== 'undefined' && 
  chrome.storage !== undefined && 
  chrome.storage.local !== undefined;

export const storage = {
  /**
   * Retrieves the list of saved colors from persistent storage.
   */
  async getSavedColors(): Promise<ColorItem[]> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['savedColors'], (result) => {
          resolve(result.savedColors || []);
        });
      });
    } else {
      let data = localStorage.getItem('colrion_saved_colors');
      if (!data) {
        const oldData = localStorage.getItem('swatchly_saved_colors');
        if (oldData) {
          data = oldData;
          localStorage.setItem('colrion_saved_colors', oldData);
          localStorage.removeItem('swatchly_saved_colors');
        }
      }
      try {
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Saves the list of colors to persistent storage.
   */
  async setSavedColors(colors: ColorItem[]): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ savedColors: colors }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_saved_colors', JSON.stringify(colors));
    }
  },

  /**
   * Retrieves the list of custom palettes from persistent storage.
   */
  async getPalettes(): Promise<Palette[]> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['palettes'], (result) => {
          resolve(result.palettes || []);
        });
      });
    } else {
      let data = localStorage.getItem('colrion_palettes');
      if (!data) {
        const oldData = localStorage.getItem('swatchly_palettes');
        if (oldData) {
          data = oldData;
          localStorage.setItem('colrion_palettes', oldData);
          localStorage.removeItem('swatchly_palettes');
        }
      }
      try {
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Saves the list of custom palettes to persistent storage.
   */
  async setPalettes(palettes: Palette[]): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ palettes }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_palettes', JSON.stringify(palettes));
    }
  },

  /**
   * Retrieves the list of recently picked colors from persistent storage.
   */
  async getRecentColors(): Promise<RecentColor[]> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['recentColors'], (result) => {
          resolve(result.recentColors || []);
        });
      });
    } else {
      let data = localStorage.getItem('colrion_recent_colors');
      if (!data) {
        const oldData = localStorage.getItem('swatchly_recent_colors');
        if (oldData) {
          data = oldData;
          localStorage.setItem('colrion_recent_colors', oldData);
          localStorage.removeItem('swatchly_recent_colors');
        }
      }
      try {
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Saves the list of recently picked colors to persistent storage.
   */
  async setRecentColors(recentColors: RecentColor[]): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ recentColors }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_recent_colors', JSON.stringify(recentColors));
    }
  },

  /**
   * Retrieves the last color picked using the EyeDropper.
   */
  async getLastPickedColor(): Promise<{ hex: string; timestamp: number } | null> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['lastPickedColor', 'lastPickedColorAt'], (result) => {
          if (result.lastPickedColor) {
            resolve({
              hex: result.lastPickedColor,
              timestamp: result.lastPickedColorAt || 0,
            });
          } else {
            resolve(null);
          }
        });
      });
    } else {
      let hex = localStorage.getItem('colrion_last_picked_color');
      let timestampStr = localStorage.getItem('colrion_last_picked_color_at');
      if (!hex) {
        const oldHex = localStorage.getItem('swatchly_last_picked_color');
        const oldTimestampStr = localStorage.getItem('swatchly_last_picked_color_at');
        if (oldHex) {
          hex = oldHex;
          timestampStr = oldTimestampStr;
          localStorage.setItem('colrion_last_picked_color', oldHex);
          if (oldTimestampStr) {
            localStorage.setItem('colrion_last_picked_color_at', oldTimestampStr);
          }
          localStorage.removeItem('swatchly_last_picked_color');
          localStorage.removeItem('swatchly_last_picked_color_at');
        }
      }
      if (hex) {
        return {
          hex,
          timestamp: timestampStr ? parseInt(timestampStr, 10) : 0,
        };
      }
      return null;
    }
  },

  /**
   * Sets the last color picked using the EyeDropper.
   */
  async setLastPickedColor(hex: string): Promise<void> {
    const timestamp = Date.now();
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ lastPickedColor: hex, lastPickedColorAt: timestamp }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_last_picked_color', hex);
      localStorage.setItem('colrion_last_picked_color_at', timestamp.toString());
    }
  },

  /**
   * Clears the last picked color from storage.
   */
  async clearLastPickedColor(): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(['lastPickedColor', 'lastPickedColorAt'], () => {
          resolve();
        });
      });
    } else {
      localStorage.removeItem('colrion_last_picked_color');
      localStorage.removeItem('colrion_last_picked_color_at');
    }
  },

  /**
   * Retrieves the app settings from persistent storage.
   */
  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      theme: 'dark',
      defaultCopyFormat: 'hex',
      enableAnimations: true,
      enableHistory: true,
      compactMode: false,
      reducedMotion: false,
    };
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          resolve({ ...defaultSettings, ...result.settings });
        });
      });
    } else {
      let data = localStorage.getItem('colrion_settings');
      if (!data) {
        const oldData = localStorage.getItem('swatchly_settings');
        if (oldData) {
          data = oldData;
          localStorage.setItem('colrion_settings', oldData);
          localStorage.removeItem('swatchly_settings');
        }
      }
      try {
        return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
      } catch {
        return defaultSettings;
      }
    }
  },

  /**
   * Saves the settings to persistent storage.
   */
  async setSettings(settings: AppSettings): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ settings }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_settings', JSON.stringify(settings));
    }
  },

  /**
   * Gets the flag to show success banner on popup load.
   */
  async getShowSuccessBanner(): Promise<boolean> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['showSuccessBanner'], (result) => {
          resolve(!!result.showSuccessBanner);
        });
      });
    } else {
      let val = localStorage.getItem('colrion_show_success_banner');
      if (val === null) {
        const oldVal = localStorage.getItem('swatchly_show_success_banner');
        if (oldVal !== null) {
          val = oldVal;
          localStorage.setItem('colrion_show_success_banner', oldVal);
          localStorage.removeItem('swatchly_show_success_banner');
        }
      }
      return val === 'true';
    }
  },

  /**
   * Sets the flag to show success banner on popup load.
   */
  async setShowSuccessBanner(show: boolean): Promise<void> {
    if (IS_EXTENSION) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ showSuccessBanner: show }, () => {
          resolve();
        });
      });
    } else {
      localStorage.setItem('colrion_show_success_banner', show ? 'true' : 'false');
    }
  }
};
