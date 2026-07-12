import React, { useEffect, useState, useRef } from 'react';
import { 
  Pipette, 
  AlertCircle, 
  X, 
  Search, 
  Download, 
  Check, 
  Plus, 
  Trash2, 
  Edit2,
  Sparkles,
  RefreshCw,
  Moon,
  ArrowRight
} from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ColorPreview } from '../components/ColorPreview';
import { ColorList } from '../components/ColorList';
import { ColorGenerator } from '../components/ColorGenerator';
import { ExtractView } from '../components/ExtractView';
import { SettingsView } from '../components/SettingsView';
import { DarkModeView } from '../components/DarkModeView';
import { useColorStore } from '../store/useColorStore';

export const App: React.FC = () => {
  const { 
    hydrate, 
    pickColor, 
    recentColors,
    palettes,
    selectedPaletteId,
    searchQuery,
    error, 
    clearError, 
    isLoading,
    setSelectedPaletteId,
    setSearchQuery,
    createPalette,
    renamePalette,
    deletePalette,
    clearRecentColors,
    setSelectedColor,
    exportColors,
    copySuccess,
    triggerCopyFeedback,
    
    // Phase 3 Store bindings
    settings,
    activeTab,
    setActiveTab,
    favoritesOnly,
    setFavoritesOnly,
    
    // Phase 1 Improvements Actions
    deleteRecentColor,

    // Color Extract bindings
    extractedPreviewColors,
    scanPage,
    isScanning
  } = useColorStore();

  // Palette form state
  const [isCreatingPalette, setIsCreatingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [renamingPaletteId, setRenamingPaletteId] = useState<string | null>(null);
  const [renamePaletteName, setRenamePaletteName] = useState('');

  // Export dropdown state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // 1. Hydrate state & listen for storage changes
  useEffect(() => {
    hydrate();

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange }, 
      areaName: string
    ) => {
      if (areaName === 'local' && (
        changes.lastPickedColor || 
        changes.savedColors || 
        changes.palettes || 
        changes.recentColors ||
        changes.settings
      )) {
        hydrate();
      }
    };

    if (
      typeof chrome !== 'undefined' && 
      chrome.storage && 
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
    return undefined;
  }, [hydrate]);

  // 2. Sync theme classes with document body
  useEffect(() => {
    const body = document.body;
    if (settings.theme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
    }

    if (settings.reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }
  }, [settings.theme, settings.reducedMotion]);

  // 3. Register global keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys if typing in interactive inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT'
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '1') {
        setActiveTab('colors');
      } else if (e.key === '2') {
        setActiveTab('generator');
      } else if (e.key === '3') {
        setActiveTab('extract');
      } else if (e.key === '4') {
        setActiveTab('settings');
      } else if (e.key === '5') {
        setActiveTab('darkmode');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        pickColor();
      } else if (e.key.toLowerCase() === 'f') {
        if (activeTab === 'colors') {
          e.preventDefault();
          setFavoritesOnly(!favoritesOnly);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, pickColor, setActiveTab, setFavoritesOnly, favoritesOnly]);

  // Click outside listener for export dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Palette CRUD triggers
  const handleCreatePalette = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaletteName.trim()) return;
    const success = await createPalette(newPaletteName);
    if (success) {
      setNewPaletteName('');
      setIsCreatingPalette(false);
    }
  };

  const handleRenamePalette = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!renamePaletteName.trim()) return;
    const success = await renamePalette(id, renamePaletteName);
    if (success) {
      setRenamingPaletteId(null);
      setRenamePaletteName('');
    }
  };

  // Export executor
  const handleExport = async (format: 'text' | 'css' | 'json') => {
    const output = exportColors(format, selectedPaletteId);
    try {
      await navigator.clipboard.writeText(output);
      triggerCopyFeedback(`export-${format}`);
      setIsExportOpen(false);
    } catch (err) {
      // Fallback copy
      try {
        const textarea = document.createElement('textarea');
        textarea.value = output;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        triggerCopyFeedback(`export-${format}`);
        setIsExportOpen(false);
      } catch (fallbackErr) {
        console.error('Export clipboard copy failed:', fallbackErr);
      }
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[380px] overflow-hidden bg-background text-text-primary">
      <Header />

      <main 
        id={`${activeTab}-panel`} 
        className="flex-1 p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        
        {/* VIEW 1: COLORS LISTING DASHBOARD */}
        {activeTab === 'colors' && (
          <>
            {/* Premium Prominent Smart Color Extract Banner/Button */}
            <button
              onClick={() => {
                setActiveTab('extract');
                scanPage();
              }}
              className="w-full relative overflow-hidden rounded-xl border border-indigo-500/25 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-3 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] shadow-md transition-all duration-200 group select-none outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background"
            >
              {/* Pulsating ambient light inside the button */}
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center gap-3 relative z-10">
                {/* Glowing Icon container */}
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {isScanning ? (
                    <RefreshCw size={15} className="animate-spin text-white" />
                  ) : (
                    <Sparkles size={15} className="text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)] animate-pulse" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-extrabold text-white tracking-wide uppercase">Color Extract</span>
                    <span className="text-[7.5px] font-extrabold bg-amber-400 text-slate-900 px-1 rounded border border-amber-300/35 shadow-sm animate-pulse leading-none flex items-center h-3">SMART</span>
                  </div>
                  <span className="text-[9.5px] text-indigo-100/80 font-medium block mt-0.5">
                    {isScanning ? 'Analyzing page palette...' : 'Scan page elements for full color system'}
                  </span>
                </div>
              </div>

              {/* Silent scan preview palette */}
              {!isScanning && extractedPreviewColors && extractedPreviewColors.length > 0 && (
                <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-full px-2 py-1 relative z-10 shadow-inner group-hover:bg-black/40 transition-colors">
                  {extractedPreviewColors.map((hex, i) => (
                    <div 
                      key={`${hex}-${i}`} 
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm first:z-30 -ml-1 first:ml-0" 
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                  <span className="text-[8px] font-extrabold text-white/90 pl-1">Preview</span>
                </div>
              )}
            </button>

            {/* Premium Prominent Dark Mode Generator Banner/Button */}
            <button
              onClick={() => {
                setActiveTab('darkmode');
              }}
              className="w-full relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-3 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_0_15px_rgba(99,102,241,0.35)] shadow-md transition-all duration-200 group select-none outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background mt-2"
            >
              {/* Subtle visual glow */}
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-indigo-500/10 to-transparent group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                  <Moon size={15} className="text-indigo-400 animate-pulse" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-extrabold text-white tracking-wide uppercase">Dark Mode Creator</span>
                    <span className="text-[7px] font-extrabold bg-indigo-500 text-white px-1 rounded border border-indigo-400/20 shadow-sm leading-none flex items-center h-3">AI</span>
                  </div>
                  <span className="text-[9.5px] text-slate-300 font-medium block mt-0.5">
                    Generate & apply custom accessible dark themes
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-text-muted group-hover:text-text-secondary transition-colors pr-1">
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Row 1: Search & Export */}
            <div className="flex items-center gap-2">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search colors (HEX, labels, notes)..."
                  className="w-full pl-8 pr-7 py-1.5 bg-surface border border-surface-border text-xs text-text-primary placeholder-text-muted rounded-lg outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors"
                  aria-label="Search saved colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 p-0.5 text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Export dropdown */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="p-2 bg-surface hover:bg-surface-hover border border-surface-border rounded-lg text-text-secondary hover:text-text-primary transition-colors outline-none focus:ring-1 focus:ring-brand"
                  title="Export colors"
                  aria-label="Export options"
                  aria-haspopup="true"
                  aria-expanded={isExportOpen}
                >
                  <Download size={14} />
                </button>

                {isExportOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-surface border border-surface-border rounded-lg shadow-xl shadow-black/45 py-1 z-50 animate-fade-in">
                    <div className="px-2.5 py-1 text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-surface-border/50">
                      Export Options
                    </div>
                    
                    <button
                      onClick={() => handleExport('text')}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-hover hover:text-white transition-colors flex items-center justify-between outline-none"
                    >
                      <span>HEX Plain List</span>
                      {copySuccess['export-text'] && <Check size={11} className="text-brand" />}
                    </button>

                    <button
                      onClick={() => handleExport('css')}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-hover hover:text-white transition-colors flex items-center justify-between outline-none"
                    >
                      <span>CSS Variables</span>
                      {copySuccess['export-css'] && <Check size={11} className="text-brand" />}
                    </button>

                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-hover hover:text-white transition-colors flex items-center justify-between outline-none"
                    >
                      <span>JSON Backup</span>
                      {copySuccess['export-json'] && <Check size={11} className="text-brand" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Horizontal Palette Pills */}
            <div 
              className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar max-w-full"
              role="group"
              aria-label="Palette selection"
            >
              {/* "All Colors" Filter Pill */}
              <button
                onClick={() => setSelectedPaletteId('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 border select-none outline-none focus:ring-1 focus:ring-brand ${
                  selectedPaletteId === 'all'
                    ? 'bg-brand border-brand text-white shadow-sm shadow-brand/10'
                    : 'bg-surface/50 border-surface-border/50 text-text-secondary hover:text-text-primary hover:border-surface-border'
                }`}
              >
                All Colors
              </button>

              {/* Loop Custom Palettes */}
              {palettes.filter(p => !p.isDarkMode).map((p) => {
                const isActive = selectedPaletteId === p.id;
                const isRenaming = renamingPaletteId === p.id;

                if (isRenaming) {
                  return (
                    <form
                      key={p.id}
                      onSubmit={(e) => handleRenamePalette(e, p.id)}
                      className="flex items-center gap-1 bg-surface border border-brand px-2 py-0.5 rounded-full flex-shrink-0"
                    >
                      <input
                        type="text"
                        value={renamePaletteName}
                        onChange={(e) => setRenamePaletteName(e.target.value)}
                        className="text-xs bg-transparent border-none text-text-primary w-16 outline-none py-0.5"
                        maxLength={15}
                        autoFocus
                        aria-label="Rename palette"
                      />
                      <button type="submit" className="text-brand hover:text-brand-hover p-0.5" aria-label="Confirm rename">
                        <Check size={11} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setRenamingPaletteId(null)}
                        className="text-text-muted hover:text-text-primary p-0.5"
                        aria-label="Cancel rename"
                      >
                        <X size={11} />
                      </button>
                    </form>
                  );
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPaletteId(p.id)}
                    className={`group px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 border flex items-center gap-1.5 select-none cursor-pointer outline-none focus:ring-1 focus:ring-brand ${
                      isActive
                        ? 'bg-brand border-brand text-white shadow-sm shadow-brand/10'
                        : 'bg-surface/50 border-surface-border/50 text-text-secondary hover:text-text-primary hover:border-surface-border'
                    }`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPaletteId(p.id);
                      }
                    }}
                  >
                    <span>{p.name}</span>
                    
                    {/* Rename/Delete inline buttons */}
                    {isActive && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingPaletteId(p.id);
                            setRenamePaletteName(p.name);
                          }}
                          className="p-0.5 text-indigo-200 hover:text-white rounded-md transition-colors"
                          title="Rename Palette"
                          aria-label="Rename palette"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete palette "${p.name}"? Saved colors will remain unassigned.`)) {
                              deletePalette(p.id);
                            }
                          }}
                          className="p-0.5 text-indigo-200 hover:text-red-300 rounded-md transition-colors"
                          title="Delete Palette"
                          aria-label="Delete palette"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* "+ New" Palette Creation Pill */}
              {isCreatingPalette ? (
                <form
                  onSubmit={handleCreatePalette}
                  className="flex items-center gap-1 bg-surface border border-brand/50 px-2 py-0.5 rounded-full flex-shrink-0"
                >
                  <input
                    type="text"
                    placeholder="Palette name..."
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    className="text-xs bg-transparent border-none text-text-primary w-20 outline-none py-0.5 placeholder-text-muted"
                    maxLength={15}
                    autoFocus
                    aria-label="New palette name"
                  />
                  <button type="submit" className="text-brand hover:text-brand-hover p-0.5" aria-label="Create palette">
                    <Check size={11} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingPalette(false)}
                    className="text-text-muted hover:text-text-primary p-0.5"
                    aria-label="Cancel creation"
                  >
                    <X size={11} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingPalette(true)}
                  className="px-2.5 py-1 border border-dashed border-surface-border hover:border-text-muted text-text-muted hover:text-text-secondary rounded-full text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0 outline-none focus:ring-1 focus:ring-brand"
                  aria-label="Create new palette"
                >
                  <Plus size={11} />
                  <span>New</span>
                </button>
              )}
            </div>


            {/* Primary CTA Pick Color */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={pickColor}
              isLoading={isLoading}
              icon={<Pipette size={14} />}
              className="py-2.5 font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-hover hover:to-indigo-700 active:scale-[0.98] outline-none focus:ring-2 focus:ring-brand shadow-md shadow-brand/15 hover:shadow-lg hover:shadow-brand/25"
              aria-label="Pick color from page (Shortcut: P)"
            >
              Pick color from page
            </Button>

            {/* Row 3: Recent History */}
            {settings.enableHistory && recentColors.length > 0 && (
              <div className="flex items-center justify-between gap-2 p-2 bg-surface/50 border border-surface-border rounded-xl shadow-inner animate-fade-in">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1">
                  <span className="text-[8.5px] font-bold text-text-muted tracking-wider uppercase pr-2 border-r border-surface-border/60 select-none">
                    Recents
                  </span>
                  
                  <div className="flex items-center gap-2 py-0.5">
                    {recentColors.map((color, index) => (
                      <div 
                        key={`${color.hex}-${index}`} 
                        className="relative group/recent-item flex-shrink-0"
                      >
                        <button
                          onClick={() => setSelectedColor(color.hex)}
                          className="w-5 h-5 rounded-full border border-surface-border hover:border-text-primary focus:ring-1 focus:ring-brand transition-all outline-none shadow-sm"
                          style={{ backgroundColor: color.hex }}
                          title={`Selected at ${new Date(color.pickedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - click to preview`}
                          aria-label={`Select recent color ${color.hex}`}
                        />
                        {/* Tiny X close button visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecentColor(color.hex);
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-surface border border-surface-border text-text-muted hover:text-red-400 flex items-center justify-center opacity-0 group-hover/recent-item:opacity-100 focus:opacity-100 transition-opacity duration-150 shadow-md outline-none"
                          title={`Delete recent color ${color.hex}`}
                          aria-label={`Delete recent color ${color.hex}`}
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={clearRecentColors}
                  className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all outline-none focus:ring-1 focus:ring-brand"
                  title="Clear recents history"
                  aria-label="Clear recents history"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {/* Error/Notice Notification Banner */}
            {(error || copySuccess['pick-success']) && (
              <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs animate-fade-in relative ${
                error 
                  ? 'bg-red-650/10 border-red-500/20 text-red-400' 
                  : 'bg-brand/10 border-brand/20 text-brand-accent'
              }`}>
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <div className="pr-4 leading-normal">
                  {error ? error : `Color picked and copied to clipboard as ${settings.defaultCopyFormat.toUpperCase()}!`}
                </div>
                <button
                  onClick={clearError}
                  className="absolute top-2 right-2 text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-zinc-850/50 outline-none"
                  aria-label="Dismiss banner"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Active Selected Color Preview */}
            <ColorPreview />

            {/* Saved Colors list */}
            <div className="pt-2.5 border-t border-surface-border/40">
              <ColorList />
            </div>
          </>
        )}

        {/* VIEW 2: SMART RELATED COLOR VARIATIONS / HARMONIES */}
        {activeTab === 'generator' && (
          <ColorGenerator />
        )}

        {/* VIEW 3: COLOR EXTRACT PANEL */}
        {activeTab === 'extract' && (
          <ExtractView />
        )}

        {/* VIEW 4: SETTINGS PANEL */}
        {activeTab === 'settings' && (
          <SettingsView />
        )}

        {/* VIEW 5: DARK MODE GENERATOR PANEL */}
        {activeTab === 'darkmode' && (
          <DarkModeView />
        )}

      </main>

      {/* Footer bar */}
      <footer className="py-2.5 border-t border-surface-border/60 text-center bg-black/20 select-none flex flex-col items-center justify-center gap-0.5">
        <p className="text-[9px] text-text-muted leading-relaxed font-medium">
          Colrion v1.0.0 &bull; Press 1, 2, 3, 4 to navigate &bull; ESC to exit forms
        </p>
        <p className="text-[9px] text-text-muted">
          Developed by{' '}
          <button
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: 'https://thinxify.com' });
              } else {
                window.open('https://thinxify.com', '_blank');
              }
            }}
            className="text-brand hover:text-brand-hover font-semibold hover:underline outline-none transition-colors"
            title="Visit THINXIFY"
          >
            THINXIFY.COM
          </button>
        </p>
      </footer>
    </div>
  );
};
