import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  FolderPlus, 
  Lock, 
  Unlock,
  Moon,
  ChevronRight
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import { getContrastRatio } from '../lib/darkModeGenerator';
import { DarkModePaletteCard } from './DarkModePaletteCard';

export const DarkModeView: React.FC = () => {
  const {
    extractedColors,
    darkModePalette,
    darkModeIntensity,
    isPreviewingDarkMode,
    generateDarkModePalette,
    setDarkModeIntensity,
    toggleDarkModePreview,
    saveDarkModePalette,
    updateDarkModeColor,
    toggleDarkModeColorLock,
    exportDarkModePalette,
    scanPage,
    isScanning,
    copySuccess,
    triggerCopyFeedback,
    palettes,
    activeWebTabUrl
  } = useColorStore();

  const [paletteName, setPaletteName] = useState('Dark Mode Palette');
  const [showSaveAllForm, setShowSaveAllForm] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [sliderVal, setSliderVal] = useState(50);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Sub-tab state
  const [subTab, setSubTab] = useState<'generator' | 'saved'>('generator');

  // Auto-generate name based on active URL
  useEffect(() => {
    if (activeWebTabUrl) {
      try {
        const urlObj = new URL(activeWebTabUrl);
        const host = urlObj.hostname.replace('www.', '');
        setPaletteName(`Dark Mode - ${host}`);
      } catch (e) {
        setPaletteName('Dark Mode Palette');
      }
    } else {
      setPaletteName('Dark Mode Palette');
    }
  }, [activeWebTabUrl]);

  // Generate the dark palette on load if we have extracted colors but dark palette is empty
  useEffect(() => {
    if (extractedColors.length > 0 && darkModePalette.length === 0) {
      generateDarkModePalette();
    }
  }, [extractedColors, darkModePalette, generateDarkModePalette]);

  const handleScanAndGenerate = async () => {
    await scanPage();
    useColorStore.getState().generateDarkModePalette();
  };

  const handleCopy = async (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(key);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleBulkSaveDarkMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paletteName.trim()) return;
    
    const success = await saveDarkModePalette(paletteName);
    if (success) {
      setSuccessMessage("Dark palette saved successfully!");
      setSaveAllSuccess(true);
      setTimeout(() => {
        setSaveAllSuccess(false);
        setShowSaveAllForm(false);
        setSuccessMessage(null);
        // Switch tab to 'saved' to view the newly saved card
        setSubTab('saved');
      }, 1500);
    }
  };

  const handleExportDarkModeClick = async (e: React.MouseEvent, format: 'css' | 'tailwind' | 'json') => {
    e.stopPropagation();
    const tokenText = exportDarkModePalette(format);
    try {
      await navigator.clipboard.writeText(tokenText);
      triggerCopyFeedback(`dark-export-${format}`);
    } catch (err) {
      console.error('Failed to copy tokens:', err);
    }
  };

  // Extract current site domain for matching
  const currentDomain = useMemo(() => {
    if (!activeWebTabUrl) return '';
    try {
      const urlObj = new URL(activeWebTabUrl);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch (e) {
      return '';
    }
  }, [activeWebTabUrl]);

  // Count matches
  const matchingPalettesCount = useMemo(() => {
    if (!currentDomain) return 0;
    return palettes.filter(p => p.isDarkMode && p.sourceUrl && p.sourceUrl.toLowerCase() === currentDomain).length;
  }, [palettes, currentDomain]);

  // Sorted saved dark mode palettes (matched domain sorted to top)
  const sortedDarkPalettes = useMemo(() => {
    const darks = palettes.filter(p => p.isDarkMode);
    if (!currentDomain) return darks;
    return [...darks].sort((a, b) => {
      const aMatch = a.sourceUrl && a.sourceUrl.toLowerCase() === currentDomain ? 1 : 0;
      const bMatch = b.sourceUrl && b.sourceUrl.toLowerCase() === currentDomain ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [palettes, currentDomain]);

  // Find backgrounds and text for previewing in the mock card
  const bgMapping = darkModePalette.find(m => m.type === 'background') || darkModePalette[0];
  const textMapping = darkModePalette.find(m => m.type === 'text') || darkModePalette[0];
  const btnMapping = darkModePalette.find(m => m.type === 'button') || darkModePalette[0];
  const borderMapping = darkModePalette.find(m => m.type === 'border') || darkModePalette[0];

  const origBg = bgMapping?.originalHex || '#f8fafc';
  const origText = textMapping?.originalHex || '#0f172a';
  const origBtn = btnMapping?.originalHex || '#7c3aed';
  const origBorder = borderMapping?.originalHex || '#e2e8f0';

  const darkBg = bgMapping?.darkHex || '#0f0f15';
  const darkText = textMapping?.darkHex || '#f8fafc';
  const darkBtn = btnMapping?.darkHex || '#9061f9';
  const darkBorder = borderMapping?.darkHex || '#1e1e2f';

  // ----------------------------------------------------
  // LOADING STATE: Scanning DOM Shimmer Loader
  // ----------------------------------------------------
  if (isScanning) {
    return (
      <div className="space-y-4 animate-pulse p-0.5">
        <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3.5 shadow-md">
          <div className="h-3 bg-zinc-800 rounded w-1/3 mb-2" />
          <div className="h-8 bg-zinc-800 rounded w-full" />
        </div>
        
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-1/4 mb-3" />
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex items-center justify-between bg-surface/50 border border-surface-border rounded-xl p-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800" />
                  <div className="w-3 h-3 bg-zinc-800" />
                  <div className="w-7 h-7 rounded-lg bg-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-zinc-800 rounded w-16" />
                  <div className="h-2 bg-zinc-800 rounded w-24" />
                </div>
              </div>
              <div className="w-12 h-6 bg-zinc-800 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-slide-up pb-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar select-none">
      
      {/* Success Notification Feedback */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold animate-fade-in">
          <Check size={14} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex bg-black/25 border border-surface-border/70 rounded-xl p-0.5 shadow-inner w-full">
        <button
          onClick={() => setSubTab('generator')}
          className={`flex-1 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider rounded-lg outline-none transition-all active:scale-[0.98] ${
            subTab === 'generator'
              ? 'bg-brand text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/30'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setSubTab('saved')}
          className={`flex-1 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider rounded-lg outline-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
            subTab === 'saved'
              ? 'bg-brand text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/30'
          }`}
        >
          <span>Saved Palettes</span>
          {matchingPalettesCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8.5px] font-extrabold text-white shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
              {matchingPalettesCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: GENERATOR */}
      {subTab === 'generator' && (
        <div className="space-y-4 animate-fade-in">
          {extractedColors.length === 0 ? (
            /* ONBOARDING STATE */
            <div className="flex flex-col items-center justify-center p-9 border border-dashed border-surface-border rounded-2xl bg-surface/10 hover:bg-surface/20 transition-all text-center select-none relative overflow-hidden group">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/15 transition-all duration-500" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-650/10 rounded-full blur-2xl group-hover:bg-indigo-650/15 transition-all duration-500" />

              <div className="w-12 h-12 rounded-full bg-black/35 border border-surface-border flex items-center justify-center text-brand mb-4 shadow-inner relative group-hover:scale-110 transition-transform duration-300">
                <Sparkles size={18} className="animate-pulse" />
                <span className="absolute inset-0 rounded-full border border-brand/20 animate-ping opacity-60" />
              </div>
              
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Dark Mode Generator</h3>
              <p className="text-[11px] text-text-muted mt-2 max-w-[250px] leading-relaxed">
                Scan your webpage elements first to establish the base color palette.
              </p>
              <p className="text-[9px] text-text-muted/60 mt-1 max-w-[220px]">
                We will intelligently scale and convert your page's custom colors into an accessible dark theme.
              </p>
              
              <button
                onClick={handleScanAndGenerate}
                className="mt-5 px-5 py-2 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-hover hover:to-indigo-700 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-brand/20 active:scale-95 outline-none hover:scale-[1.02] duration-150"
              >
                <Sparkles size={12} />
                <span>Scan & Generate Theme</span>
              </button>
            </div>
          ) : (
            /* GENERATOR DETAILS */
            <>
              {/* Control Header & Preview Configs */}
              <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow-md">
                
                {/* Row 1: Title & Preview Button */}
                <div className="flex items-center justify-between border-b border-surface-border/50 pb-2">
                  <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider">Dark Mode Creator</span>
                  
                  {/* Toggle Preview Button */}
                  <button
                    onClick={() => toggleDarkModePreview()}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all outline-none ${
                      isPreviewingDarkMode
                        ? 'bg-brand/15 border-brand/45 text-brand-accent hover:bg-brand/20 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                        : 'bg-surface border-surface-border text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {isPreviewingDarkMode ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{isPreviewingDarkMode ? 'Active' : 'Preview'}</span>
                  </button>
                </div>

                {/* Row 2: Custom Styled Intensity Range Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-text-muted font-bold px-0.5">
                    <span>Intensity</span>
                    <span className="text-brand font-extrabold uppercase tracking-wide">
                      {darkModeIntensity === 'soft' ? 'Soft Dark (Default)' : 'Deep Dark (True Black)'}
                    </span>
                  </div>
                  <div className="relative flex items-center h-4 mt-0.5">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="1"
                      value={darkModeIntensity === 'soft' ? 0 : 1}
                      onChange={(e) => setDarkModeIntensity(e.target.value === '0' ? 'soft' : 'deep')}
                      className="w-full h-1 bg-surface-border rounded-lg appearance-none cursor-pointer accent-brand outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Draggable Split-Pane Before/After Visual Mockup Preview */}
              {darkModePalette.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
                    <span>Before / After Comparison</span>
                    <span className="text-[8px] text-brand font-semibold lowercase">Drag split handle</span>
                  </div>
                  
                  <div className="relative w-full h-[125px] rounded-xl overflow-hidden border border-surface-border bg-slate-900 shadow-md">
                    
                    {/* Pane 1 (Light / Original) */}
                    <div className="absolute inset-0 select-none pointer-events-none rounded-xl" style={{ backgroundColor: origBg, color: origText }}>
                      <div className="p-2.5 border-b" style={{ borderColor: origBorder }}>
                        <div className="flex items-center justify-between">
                          <div className="text-[9px] font-extrabold">Brand Mockup</div>
                          <div className="text-[7.5px] uppercase tracking-wider font-medium" style={{ color: origText + '80' }}>Dashboard</div>
                        </div>
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <div className="text-[10px] font-bold leading-tight">Visual Accessibility Hierarchy</div>
                        <p className="text-[8px] leading-snug" style={{ color: origText + 'a0' }}>
                          Intelligent luminance scaling preserves your original brand contrast ratio.
                        </p>
                        <div className="flex justify-between items-center pt-1.5">
                          <span className="px-2 py-0.5 text-[7.5px] font-bold text-white rounded shadow-sm" style={{ backgroundColor: origBtn }}>
                            Action
                          </span>
                          <span className="text-[7.5px] font-bold border-b" style={{ color: origText, borderColor: origText + '40' }}>
                            Secondary Link
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pane 2 (Dark / Transformed) */}
                    <div 
                      className="absolute inset-0 select-none pointer-events-none rounded-xl overflow-hidden border-r border-brand/50" 
                      style={{ width: `${sliderVal}%`, backgroundColor: darkBg, color: darkText }}
                    >
                      <div className="w-[350px] h-[125px]">
                        <div className="p-2.5 border-b" style={{ borderColor: darkBorder }}>
                          <div className="flex items-center justify-between">
                            <div className="text-[9px] font-extrabold">Brand Mockup</div>
                            <div className="text-[7.5px] uppercase tracking-wider font-medium" style={{ color: darkText + '80' }}>Dashboard</div>
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          <div className="text-[10px] font-bold leading-tight">Visual Accessibility Hierarchy</div>
                          <p className="text-[8px] leading-snug" style={{ color: darkText + 'a0' }}>
                            Intelligent luminance scaling preserves your original brand contrast ratio.
                          </p>
                          <div className="flex justify-between items-center pt-1.5">
                            <span className="px-2 py-0.5 text-[7.5px] font-bold text-white rounded shadow-sm" style={{ backgroundColor: darkBtn }}>
                              Action
                            </span>
                            <span className="text-[7.5px] font-bold border-b" style={{ color: darkText, borderColor: darkText + '40' }}>
                              Secondary Link
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Slide Control Divider handle */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-brand pointer-events-none z-10" style={{ left: `${sliderVal}%` }}>
                      <div className="absolute top-1/2 -left-[7px] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-brand border border-white flex items-center justify-center shadow-md">
                        <span className="text-[7.5px] text-white font-extrabold leading-none">&harr;</span>
                      </div>
                    </div>

                    {/* Range slider covering whole preview to handle events */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderVal}
                      onChange={(e) => setSliderVal(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Color Transformations List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
                  <span>Transformed Color Palette</span>
                  <span className="text-[8px] text-brand font-semibold lowercase">Click dark swatch to fine-tune</span>
                </div>

                <div className="space-y-2">
                  {darkModePalette.map((m) => {
                    const darkKey = `dark-copy-${m.darkHex}`;
                    const isDarkCopied = copySuccess[darkKey];

                    // Calculate WCAG contrast ratio only for Foreground Elements (text/button) against the dark background
                    const isForeground = m.type === 'text' || m.type === 'button';
                    const contrastVal = isForeground && bgMapping ? getContrastRatio(m.darkHex, bgMapping.darkHex) : null;
                    const passesWCAG = contrastVal !== null ? contrastVal >= 4.5 : null;

                    return (
                      <div
                        key={m.originalHex}
                        className="flex items-center justify-between bg-surface/50 border border-surface-border rounded-xl p-2.5 hover:bg-surface transition-all duration-150 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-7 h-7 rounded-lg border border-surface-border shadow-inner"
                              style={{ backgroundColor: m.originalHex }}
                              title={`Original Light: ${m.originalHex} (${m.originalLabel})`}
                            />
                            <ChevronRight size={12} className="text-text-muted" />
                            
                            <div 
                              className="w-7 h-7 rounded-lg border border-surface-border shadow-md cursor-pointer relative hover:scale-105 active:scale-95 transition-transform"
                              style={{ backgroundColor: m.darkHex }}
                              title={`Click to adjust Dark Color (Current: ${m.darkHex})`}
                              onClick={() => {
                                const picker = document.getElementById(`picker-${m.originalHex.replace('#', '')}`);
                                picker?.click();
                              }}
                            >
                              <input
                                id={`picker-${m.originalHex.replace('#', '')}`}
                                type="color"
                                value={m.darkHex}
                                onChange={(e) => updateDarkModeColor(m.originalHex, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={(e) => handleCopy(e, m.darkHex, darkKey)}
                                className="text-[10px] font-mono font-bold text-text-primary uppercase hover:text-brand cursor-pointer transition-colors"
                              >
                                {m.darkHex}
                              </span>
                              <span className="text-[7.5px] uppercase font-bold text-text-muted bg-surface-hover border border-surface-border/50 px-1 rounded leading-none py-0.5">
                                {m.type}
                              </span>
                              
                              {/* WCAG AA Contrast Badge */}
                              {contrastVal !== null && (
                                <span className={`text-[7px] font-bold px-1 rounded py-0.5 leading-none ${
                                  passesWCAG 
                                    ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' 
                                    : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                                }`}>
                                  {passesWCAG ? 'AA Pass' : 'Low Contrast'} ({contrastVal.toFixed(1)}:1)
                                </span>
                              )}
                            </div>
                            <span className="text-[8.5px] text-text-muted block mt-0.5 leading-none">
                              Original: {m.originalHex} ({m.originalLabel})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDarkModeColorLock(m.originalHex);
                            }}
                            className={`p-1 rounded-md border transition-colors outline-none ${
                              m.locked 
                                ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-amber-500/20' 
                                : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title={m.locked ? "Color locked" : "Lock color"}
                          >
                            {m.locked ? <Lock size={10} /> : <Unlock size={10} />}
                          </button>
                          <button
                            onClick={(e) => handleCopy(e, m.darkHex, darkKey)}
                            className={`p-1 rounded-md border transition-colors outline-none ${
                              isDarkCopied 
                                ? 'bg-brand/15 border-brand/35 text-brand' 
                                : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title="Copy Transformed HEX"
                          >
                            {isDarkCopied ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Dark Mode Palette Form */}
              <div className="pt-2.5 border-t border-surface-border/40">
                {showSaveAllForm ? (
                  <form onSubmit={handleBulkSaveDarkMode} className="bg-surface border border-surface-border/60 rounded-xl p-3 space-y-2.5 animate-slide-up">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Save Dark Mode Palette</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={paletteName}
                        onChange={(e) => setPaletteName(e.target.value)}
                        placeholder="Enter dark palette name..."
                        className="flex-1 text-xs bg-surface border border-surface-border text-text-primary rounded-lg py-1.5 px-2.5 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40"
                        maxLength={25}
                      />
                      <button
                        type="submit"
                        disabled={saveAllSuccess}
                        className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97] flex-shrink-0 flex items-center gap-1.5 shadow"
                      >
                        {saveAllSuccess ? (
                          <>
                            <Check size={12} />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <span>Save All</span>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSaveAllForm(false)}
                      className="text-[9px] text-text-muted hover:text-text-primary font-bold underline outline-none"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setShowSaveAllForm(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-surface-border hover:border-brand/40 hover:bg-brand/5 text-text-secondary hover:text-brand text-xs font-bold rounded-xl transition-all outline-none"
                  >
                    <FolderPlus size={13} />
                    <span>Save Dark Mode Palette</span>
                  </button>
                )}
              </div>

              {/* Exports Section */}
              <div className="bg-surface border border-surface-border rounded-xl p-3 space-y-2.5 shadow-md">
                <span className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider block border-b border-surface-border/50 pb-1.5">
                  Export Dark Tokens
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={(e) => handleExportDarkModeClick(e, 'css')}
                    className="flex items-center justify-center gap-1 py-1.5 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border rounded-lg text-[9.5px] font-bold transition-all active:scale-95 outline-none"
                  >
                    {copySuccess['dark-export-css'] ? <Check size={11} className="text-brand animate-pulse" /> : <Copy size={11} />}
                    <span>CSS Vars</span>
                  </button>
                  <button
                    onClick={(e) => handleExportDarkModeClick(e, 'tailwind')}
                    className="flex items-center justify-center gap-1 py-1.5 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border rounded-lg text-[9.5px] font-bold transition-all active:scale-95 outline-none"
                  >
                    {copySuccess['dark-export-tailwind'] ? <Check size={11} className="text-brand animate-pulse" /> : <Copy size={11} />}
                    <span>Tailwind</span>
                  </button>
                  <button
                    onClick={(e) => handleExportDarkModeClick(e, 'json')}
                    className="flex items-center justify-center gap-1 py-1.5 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-surface-border rounded-lg text-[9.5px] font-bold transition-all active:scale-95 outline-none"
                  >
                    {copySuccess['dark-export-json'] ? <Check size={11} className="text-brand animate-pulse" /> : <Copy size={11} />}
                    <span>Tokens JSON</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: SAVED PALETTES */}
      {subTab === 'saved' && (
        <div className="space-y-3.5 animate-fade-in">
          {sortedDarkPalettes.length > 0 ? (
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider block border-b border-surface-border/50 pb-1.5 px-0.5">
                Saved Dark Themes ({sortedDarkPalettes.length})
              </span>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5 custom-scrollbar">
                {sortedDarkPalettes.map(p => (
                  <DarkModePaletteCard key={p.id} palette={p} />
                ))}
              </div>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center p-9 border border-dashed border-surface-border rounded-2xl bg-surface/10 text-center select-none relative group min-h-[220px]">
              <div className="w-12 h-12 rounded-full bg-black/35 border border-surface-border flex items-center justify-center text-text-muted mb-4 shadow-inner relative">
                <Moon size={18} className="opacity-60" />
              </div>
              
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">No dark palettes saved yet</h3>
              <p className="text-[11px] text-text-muted mt-2 max-w-[250px] leading-relaxed">
                You haven't saved any dark themes. Generate one in the Generator tab to populate your library!
              </p>
              
              <button
                onClick={() => setSubTab('generator')}
                className="mt-5 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-surface-border text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-bold transition-all active:scale-95"
              >
                Go to Generator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
