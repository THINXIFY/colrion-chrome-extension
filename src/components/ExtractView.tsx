import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  AlertCircle, 
  FolderPlus, 
  Tag,
  Lock,
  Unlock,
  ChevronLeft,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';

export const ExtractView: React.FC = () => {
  const {
    extractedColors,
    scanMode,
    isScanning,
    hoverHighlightEnabled,
    error,
    clearError,
    setScanMode,
    setHoverHighlightEnabled,
    scanPage,
    relabelColor,
    saveAllExtractedToPalette,
    highlightColorOnPage,
    clearHighlightsOnPage,
    savedColors,
    saveSelectedColor,
    setSelectedColor,
    copySuccess,
    triggerCopyFeedback,
    toggleLockColor,
    activeHighlightedColor,
    toggleHighlightColorOnPage,
    reorderExtractedColors,
    
    // Dark Mode Generator bindings
    darkModePalette,
    darkModeIntensity,
    isPreviewingDarkMode,
    generateDarkModePalette,
    setDarkModeIntensity,
    toggleDarkModePreview,
    saveDarkModePalette,
    updateDarkModeColor,
    exportDarkModePalette
  } = useColorStore();

  const matchedColors = extractedColors.filter(c => c.isMatched !== false);
  const unmatchedColors = extractedColors.filter(c => c.isMatched === false);

  const [paletteName, setPaletteName] = useState('Extracted Page Palette');
  const [showSaveAllForm, setShowSaveAllForm] = useState(false);
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const [showDarkModePanel, setShowDarkModePanel] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCopy = async (e: React.MouseEvent, text: string, key: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(key);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleSaveIndividual = async (e: React.MouseEvent, hex: string, label: string) => {
    e.stopPropagation();
    setSelectedColor(hex);
    await saveSelectedColor();
    setTimeout(async () => {
      const freshSaved = useColorStore.getState().savedColors.find(
        c => c.hex.toLowerCase() === hex.toLowerCase()
      );
      if (freshSaved) {
        await useColorStore.getState().updateColorMetadata(freshSaved.id, label, 'Extracted from page');
      }
    }, 100);
  };

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paletteName.trim()) return;
    
    const success = await saveAllExtractedToPalette(paletteName);
    if (success) {
      setSaveAllSuccess(true);
      setTimeout(() => {
        setSaveAllSuccess(false);
        setShowSaveAllForm(false);
      }, 1800);
    }
  };

  const handleBulkSaveDarkMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paletteName.trim()) return;
    
    const success = await saveDarkModePalette(paletteName);
    if (success) {
      setSaveAllSuccess(true);
      setTimeout(() => {
        setSaveAllSuccess(false);
        setShowSaveAllForm(false);
      }, 1800);
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

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (extractedColors[index].locked) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    if (extractedColors[index].locked) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    if (extractedColors[index].locked) return;

    const updated = [...extractedColors];
    const draggedColor = updated[draggedIndex];
    
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedColor);
    
    reorderExtractedColors(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Label options for classification
  const labelOptions = [
    'Primary',
    'Secondary',
    'Accent',
    'Background',
    'Text',
    'Neutral Light',
    'Neutral Dark',
    'Brand Primary',
    'Link Accent'
  ];

  const getConfidenceStyles = (conf: 'High' | 'Medium' | 'Low') => {
    switch (conf) {
      case 'High':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Low':
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  // ----------------------------------------------------
  // CONDITIONAL VIEW: DARK MODE GENERATOR PANEL
  // ----------------------------------------------------
  if (showDarkModePanel) {
    return (
      <div className="space-y-3.5 animate-slide-up pb-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar select-none">
        
        {/* Control Header & Preview Configs */}
        <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-surface-border/50 pb-2">
            <button
              onClick={() => {
                setShowDarkModePanel(false);
                // Clean up preview stylesheet when going back
                if (isPreviewingDarkMode) {
                  toggleDarkModePreview();
                }
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-text-primary uppercase transition-colors"
            >
              <ChevronLeft size={12} />
              <span>Back to Colors</span>
            </button>
            <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider">Dark Mode Creator</span>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Intensity Toggle */}
            <div className="flex bg-black/25 border border-surface-border rounded-lg p-0.5 shadow-inner">
              <button
                onClick={() => setDarkModeIntensity('soft')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  darkModeIntensity === 'soft' 
                    ? 'bg-brand text-white shadow-md shadow-brand/15' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Soft Dark
              </button>
              <button
                onClick={() => setDarkModeIntensity('deep')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  darkModeIntensity === 'deep' 
                    ? 'bg-brand text-white shadow-md shadow-brand/15' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Deep Dark
              </button>
            </div>

            {/* Toggle Preview Button */}
            <button
              onClick={() => toggleDarkModePreview()}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-bold rounded-lg border transition-all outline-none ${
                isPreviewingDarkMode
                  ? 'bg-brand/10 border-brand/45 text-brand hover:bg-brand/15 shadow-[0_0_8px_rgba(99,102,241,0.2)] animate-pulse'
                  : 'bg-surface border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {isPreviewingDarkMode ? <Eye size={12} className="text-brand" /> : <EyeOff size={12} />}
              <span>{isPreviewingDarkMode ? 'Preview Active' : 'Preview Page'}</span>
            </button>
          </div>
        </div>

        {/* Color Transformations list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
            <span>Color Transformations</span>
            <span className="text-[8px] text-brand font-semibold lowercase">Click dark swatch to adjust</span>
          </div>

          <div className="space-y-2">
            {darkModePalette.map((m) => {
              const darkKey = `dark-copy-${m.darkHex}`;
              const isDarkCopied = copySuccess[darkKey];

              return (
                <div
                  key={m.originalHex}
                  className="flex items-center justify-between bg-surface/50 border border-surface-border rounded-xl p-2.5 hover:bg-surface transition-all duration-150 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* Comparative swatches */}
                    <div className="flex items-center gap-1.5">
                      {/* Original color */}
                      <div 
                        className="w-7 h-7 rounded-lg border border-surface-border shadow-inner"
                        style={{ backgroundColor: m.originalHex }}
                        title={`Original: ${m.originalHex} (${m.originalLabel})`}
                      />
                      <ArrowRight size={12} className="text-text-muted" />
                      
                      {/* Dark mode transformed color (clickable color picker) */}
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

                    {/* Meta info */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-text-primary uppercase tracking-wide">
                          {m.darkHex}
                        </span>
                        <span className="text-[7px] uppercase font-bold text-text-muted bg-surface-hover/80 px-1 rounded border border-surface-border/50 leading-none py-0.5">
                          {m.type}
                        </span>
                      </div>
                      <span className="text-[8.5px] text-text-muted block mt-0.5 leading-none">
                        Original: {m.originalHex} ({m.originalLabel})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopy(e, m.darkHex, darkKey)}
                      className={`p-1 rounded-md border transition-colors outline-none ${
                        isDarkCopied 
                          ? 'bg-brand/15 border-brand/35 text-brand' 
                          : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                      }`}
                      title="Copy Dark HEX"
                    >
                      {isDarkCopied ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Dark Mode Palette */}
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
                setPaletteName('Dark Page Palette');
                setShowSaveAllForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-surface-border hover:border-brand/40 hover:bg-brand/5 text-text-secondary hover:text-brand text-xs font-bold rounded-xl transition-all outline-none"
            >
              <FolderPlus size={13} />
              <span>Save Dark Mode Palette</span>
            </button>
          )}
        </div>

        {/* Exports Segment */}
        <div className="bg-surface border border-surface-border rounded-xl p-3 space-y-2.5 shadow-md">
          <span className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider block border-b border-surface-border/50 pb-1">
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
      </div>
    );
  }

  // ----------------------------------------------------
  // STANDARD PALETTE / EXTRACTION VIEW
  // ----------------------------------------------------
  return (
    <div className="space-y-3.5 animate-slide-up pb-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar select-none">
      
      {/* Control Panel: Scan configurations */}
      <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow-md">
        
        {/* Row 1: Mode Segmented Picker & Hover Toggle */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Mode Selector */}
          <div className="flex bg-black/25 border border-surface-border rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => setScanMode('viewport')}
              disabled={isScanning}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                scanMode === 'viewport' 
                  ? 'bg-brand text-white shadow-md shadow-brand/15' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Viewport Scan
            </button>
            <button
              onClick={() => setScanMode('full')}
              disabled={isScanning}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                scanMode === 'full' 
                  ? 'bg-brand text-white shadow-md shadow-brand/15' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Full DOM Scan
            </button>
          </div>

          {/* Highlights toggle button */}
          <button
            onClick={() => setHoverHighlightEnabled(!hoverHighlightEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all outline-none ${
              hoverHighlightEnabled
                ? 'bg-brand/10 border-brand/35 text-brand hover:bg-brand/15'
                : 'bg-surface border-surface-border text-text-muted hover:text-text-secondary'
            }`}
            title="Outline elements of this color when hovering swatches"
          >
            {hoverHighlightEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>Hover Highlights</span>
          </button>
        </div>

        {/* Scan Actions */}
        <button
          onClick={() => scanPage()}
          disabled={isScanning}
          className={`w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-hover hover:to-indigo-700 active:scale-[0.98] transition-all rounded-lg text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-brand/10 ${
            isScanning ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Analyzing elements...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>{extractedColors.length > 0 ? 'Re-scan Page Colors' : 'Scan Page Elements'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border text-xs bg-red-650/10 border-red-500/20 text-red-400 animate-fade-in relative">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <div className="pr-4 leading-normal">{error}</div>
          <button 
            onClick={clearError}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary p-0.5 rounded-md hover:bg-zinc-850/50"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid: Extracted colors list */}
      {isScanning ? (
        /* Loading scanning screen */
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-surface-border/50 rounded-2xl bg-surface/10 text-center animate-pulse">
          <div className="relative w-12 h-12 rounded-full border border-brand/30 flex items-center justify-center text-brand mb-4">
            <RefreshCw size={20} className="animate-spin text-brand" />
            <span className="absolute inset-0 rounded-full border-t-2 border-brand animate-ping" />
          </div>
          <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Analyzing page colors</p>
          <p className="text-[10px] text-text-muted mt-1.5 max-w-[200px] leading-relaxed">
            Crawling stylesheets and element layout hierarchy to extract dominant visual colors...
          </p>
        </div>
      ) : extractedColors.length > 0 ? (
        /* Content layout colors */
        <div className="space-y-3">
          
          {/* Dominant Palette (Matched Colors) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
              <span>Dominant Palette ({matchedColors.length} colors)</span>
              <span className="text-[8px] text-brand font-semibold lowercase">Click swatches to highlight usage</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {matchedColors.map((color) => {
                const absoluteIndex = extractedColors.findIndex(c => c.hex === color.hex);
                const copyKey = `extract-copy-${color.hex}`;
                const isCopied = copySuccess[copyKey];
                const isSaved = savedColors.some(c => c.hex.toLowerCase() === color.hex.toLowerCase());
                
                const isDragging = draggedIndex === absoluteIndex;
                const isDragOver = dragOverIndex === absoluteIndex;
                const isHighlighted = activeHighlightedColor === color.hex;

                return (
                  <div
                    key={color.hex}
                    draggable={!color.locked}
                    onDragStart={(e) => handleDragStart(e, absoluteIndex)}
                    onDragOver={(e) => handleDragOver(e, absoluteIndex)}
                    onDrop={(e) => handleDrop(e, absoluteIndex)}
                    onDragEnd={handleDragEnd}
                    onMouseEnter={() => highlightColorOnPage(color.hex)}
                    onMouseLeave={() => clearHighlightsOnPage()}
                    onClick={() => toggleHighlightColorOnPage(color.hex)}
                    className={`group relative border bg-surface/50 hover:bg-surface rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 h-[116px] hover:shadow select-none ${
                      isDragging ? 'opacity-30 scale-[0.97] border-surface-border/50' : ''
                    } ${
                      isDragOver ? 'border-brand border-dashed bg-brand/5 scale-[1.02] shadow-md shadow-brand/10' : ''
                    } ${
                      isHighlighted 
                        ? 'border-brand ring-2 ring-brand/35 bg-surface hover:bg-surface shadow-md shadow-brand/10' 
                        : 'border-surface-border hover:border-text-muted/30'
                    }`}
                    title={color.locked ? "Unlock to drag and re-order" : "Drag to reorder/reassign design role"}
                  >
                    {/* Swatch & Actions overlay */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div 
                        className="w-7 h-7 rounded-lg border border-surface-border shadow-sm flex-shrink-0 relative"
                        style={{ backgroundColor: color.hex }}
                      >
                        {/* Highlight indicator dot */}
                        {isHighlighted && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border border-white animate-ping" />
                        )}
                      </div>
                      
                      {/* Inline actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Lock Role Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockColor(color.hex);
                          }}
                          className={`p-1 rounded-md border transition-colors outline-none ${
                            color.locked 
                              ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-amber-500/20' 
                              : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                          }`}
                          title={color.locked ? "Unlock Design Role" : "Lock Design Role"}
                        >
                          {color.locked ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                        <button
                          onClick={(e) => handleCopy(e, color.hex, copyKey)}
                          className={`p-1 rounded-md border transition-colors outline-none ${
                            isCopied 
                              ? 'bg-brand/15 border-brand/35 text-brand' 
                              : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                          }`}
                          title="Copy HEX code"
                        >
                          {isCopied ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                        <button
                          onClick={(e) => handleSaveIndividual(e, color.hex, color.label)}
                          className={`p-1 rounded-md border transition-colors outline-none ${
                            isSaved 
                              ? 'bg-brand/15 border-brand/35 text-brand' 
                              : 'bg-surface border-surface-border text-text-muted hover:text-brand hover:bg-surface-hover'
                          }`}
                          disabled={isSaved}
                          title={isSaved ? "Saved" : "Save Color"}
                        >
                          {isSaved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
                        </button>
                      </div>
                    </div>

                    {/* HEX Code & Confidence */}
                    <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                      <span 
                        onClick={(e) => handleCopy(e, color.hex, copyKey)}
                        className="text-[11px] font-mono font-bold text-text-primary uppercase hover:text-brand transition-colors"
                      >
                        {color.hex}
                      </span>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border leading-none ${getConfidenceStyles(color.confidence)}`}>
                        {color.confidence}
                      </span>
                    </div>

                    {/* Usage source indicators */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap overflow-hidden max-h-[14px]">
                      {color.sourceTypes.map((type) => (
                        <span 
                          key={type} 
                          className="text-[7.5px] uppercase font-bold tracking-wider text-text-muted bg-surface-hover/80 border border-surface-border/50 px-1 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Manual Label Select Dropdown */}
                    <div className="mt-1.5 pt-1.5 border-t border-surface-border/50 flex items-center gap-1 select-none">
                      <Tag size={8} className="text-text-muted flex-shrink-0" />
                      
                      <select
                        value={color.label}
                        onChange={(e) => relabelColor(color.hex, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[9px] font-bold bg-transparent border-none text-text-secondary outline-none focus:text-brand cursor-pointer p-0 select-none"
                      >
                        {labelOptions.map(opt => (
                          <option key={opt} value={opt} className="bg-surface text-text-primary text-[10px]">
                            {opt}
                          </option>
                        ))}
                        {!labelOptions.includes(color.label) && (
                          <option value={color.label} className="bg-surface text-text-primary text-[10px]">
                            {color.label}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* No Match Colors (Unmatched Colors) Section */}
          <div className="space-y-3 pt-3 border-t border-surface-border/40 mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
              <span>No Match Colors ({unmatchedColors.length})</span>
              <span className="text-[8px] text-brand font-semibold lowercase">Uncategorized minor page elements</span>
            </div>

            {unmatchedColors.length === 0 ? (
              <p className="text-[10px] text-text-muted/60 italic px-1">
                All extracted colors have been matched to the dominant palette layout.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {unmatchedColors.map((color) => {
                  const absoluteIndex = extractedColors.findIndex(c => c.hex === color.hex);
                  const copyKey = `extract-copy-${color.hex}`;
                  const isCopied = copySuccess[copyKey];
                  const isSaved = savedColors.some(c => c.hex.toLowerCase() === color.hex.toLowerCase());
                  
                  const isDragging = draggedIndex === absoluteIndex;
                  const isDragOver = dragOverIndex === absoluteIndex;
                  const isHighlighted = activeHighlightedColor === color.hex;

                  return (
                    <div
                      key={color.hex}
                      draggable={!color.locked}
                      onDragStart={(e) => handleDragStart(e, absoluteIndex)}
                      onDragOver={(e) => handleDragOver(e, absoluteIndex)}
                      onDrop={(e) => handleDrop(e, absoluteIndex)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={() => highlightColorOnPage(color.hex)}
                      onMouseLeave={() => clearHighlightsOnPage()}
                      onClick={() => toggleHighlightColorOnPage(color.hex)}
                      className={`group relative border bg-surface/30 hover:bg-surface/50 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 h-[116px] hover:shadow select-none ${
                        isDragging ? 'opacity-30 scale-[0.97] border-surface-border/50' : ''
                      } ${
                        isDragOver ? 'border-brand border-dashed bg-brand/5 scale-[1.02] shadow-md shadow-brand/10' : ''
                      } ${
                        isHighlighted 
                          ? 'border-brand ring-2 ring-brand/35 bg-surface hover:bg-surface shadow-md shadow-brand/10' 
                          : 'border-surface-border hover:border-text-muted/20'
                      }`}
                      title={color.locked ? "Unlock to drag and re-order" : "Drag to reorder/reassign design role"}
                    >
                      {/* Swatch & Actions overlay */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div 
                          className="w-7 h-7 rounded-lg border border-surface-border/70 shadow-sm flex-shrink-0 relative"
                          style={{ backgroundColor: color.hex }}
                        >
                          {/* Highlight indicator dot */}
                          {isHighlighted && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand border border-white animate-ping" />
                          )}
                        </div>
                        
                        {/* Inline actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Lock Role Toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLockColor(color.hex);
                            }}
                            className={`p-1 rounded-md border transition-colors outline-none ${
                              color.locked 
                                ? 'bg-amber-500/10 border-amber-500/35 text-amber-500 hover:bg-amber-500/20' 
                                : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title={color.locked ? "Unlock Design Role" : "Lock Design Role"}
                          >
                            {color.locked ? <Lock size={10} /> : <Unlock size={10} />}
                          </button>
                          <button
                            onClick={(e) => handleCopy(e, color.hex, copyKey)}
                            className={`p-1 rounded-md border transition-colors outline-none ${
                              isCopied 
                                ? 'bg-brand/15 border-brand/35 text-brand' 
                                : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title="Copy HEX code"
                          >
                            {isCopied ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                          <button
                            onClick={(e) => handleSaveIndividual(e, color.hex, color.label)}
                            className={`p-1 rounded-md border transition-colors outline-none ${
                              isSaved 
                                ? 'bg-brand/15 border-brand/35 text-brand' 
                                : 'bg-surface border-surface-border text-text-muted hover:text-brand hover:bg-surface-hover'
                            }`}
                            disabled={isSaved}
                            title={isSaved ? "Saved" : "Save Color"}
                          >
                            {isSaved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
                          </button>
                        </div>
                      </div>

                      {/* HEX Code & Confidence */}
                      <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                        <span 
                          onClick={(e) => handleCopy(e, color.hex, copyKey)}
                          className="text-[11px] font-mono font-bold text-text-primary uppercase hover:text-brand transition-colors"
                        >
                          {color.hex}
                        </span>
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border leading-none ${getConfidenceStyles(color.confidence)}`}>
                          {color.confidence}
                        </span>
                      </div>

                      {/* Usage source indicators */}
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap overflow-hidden max-h-[14px]">
                        {color.sourceTypes.map((type) => (
                          <span 
                            key={type} 
                            className="text-[7.5px] uppercase font-bold tracking-wider text-text-muted bg-surface-hover/80 border border-surface-border/50 px-1 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Manual Label Select Dropdown */}
                      <div className="mt-1.5 pt-1.5 border-t border-surface-border/50 flex items-center gap-1 select-none">
                        <Tag size={8} className="text-text-muted flex-shrink-0" />
                        
                        <select
                          value={color.label}
                          onChange={(e) => relabelColor(color.hex, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-[9px] font-bold bg-transparent border-none text-text-secondary outline-none focus:text-brand cursor-pointer p-0 select-none"
                        >
                          {labelOptions.map(opt => (
                            <option key={opt} value={opt} className="bg-surface text-text-primary text-[10px]">
                              {opt}
                            </option>
                          ))}
                          {!labelOptions.includes(color.label) && (
                            <option value={color.label} className="bg-surface text-text-primary text-[10px]">
                              {color.label}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bulk actions segment */}
          <div className="pt-2 border-t border-surface-border/40 space-y-2">
            
            {/* Generate Dark Mode Button */}
            <button
              onClick={() => {
                generateDarkModePalette();
                setPaletteName('Dark Page Palette');
                setShowDarkModePanel(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-violet-650 via-indigo-650 to-blue-650 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all outline-none"
            >
              <Sliders size={13} className="animate-pulse" />
              <span>Intelligent Dark Theme Creator</span>
            </button>

            {showSaveAllForm ? (
              <form onSubmit={handleBulkSave} className="bg-surface border border-surface-border/60 rounded-xl p-3 space-y-2.5 animate-slide-up">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Save Colors as Palette</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={paletteName}
                    onChange={(e) => setPaletteName(e.target.value)}
                    placeholder="Enter palette name..."
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
                onClick={() => setShowSaveAllForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-surface-border hover:border-brand/40 hover:bg-brand/5 text-text-secondary hover:text-brand text-xs font-bold rounded-xl transition-all outline-none"
              >
                <FolderPlus size={13} />
                <span>Save All to Custom Palette</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Premium Onboarding Screen */
        <div className="flex flex-col items-center justify-center p-9 border border-dashed border-surface-border rounded-2xl bg-surface/10 hover:bg-surface/20 transition-all text-center animate-fade-in my-1 select-none relative overflow-hidden group">
          {/* Subtle colored ambient glow in the background */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/15 transition-all duration-500" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-650/10 rounded-full blur-2xl group-hover:bg-indigo-650/15 transition-all duration-500" />

          <div className="w-12 h-12 rounded-full bg-black/35 border border-surface-border flex items-center justify-center text-brand mb-4 shadow-inner relative group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={18} className="animate-pulse" />
            <span className="absolute inset-0 rounded-full border border-brand/20 animate-ping opacity-60" />
          </div>
          
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Smart Color Extraction</h3>
          <p className="text-[11px] text-text-muted mt-2 max-w-[250px] leading-relaxed">
            Scan this page to extract its full color system
          </p>
          <p className="text-[9px] text-text-muted/60 mt-1 max-w-[220px]">
            Uses weighted visual dominance and active DOM scanning to cluster colors.
          </p>
          
          <button
            onClick={() => scanPage()}
            className="mt-5 px-5 py-2 bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-hover hover:to-indigo-700 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-brand/20 active:scale-95 outline-none hover:scale-[1.02] duration-150"
          >
            <Sparkles size={12} />
            <span>Scan Page System</span>
          </button>
        </div>
      )}
    </div>
  );
};
