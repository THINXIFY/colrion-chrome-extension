import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Check, 
  Copy, 
  Sparkles 
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import { getShades, getHarmonies, getGradients } from '../lib/colorUtils';

export const ColorGenerator: React.FC = () => {
  const { 
    selectedColor, 
    setSelectedColor, 
    saveSelectedColor,
    copySuccess,
    triggerCopyFeedback,
    savedColors
  } = useColorStore();

  const [activeSubTab, setActiveSubTab] = useState<'harmonies' | 'shades' | 'gradients'>('harmonies');

  if (!selectedColor) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-surface-border rounded-2xl bg-surface/30 text-center animate-fade-in my-3 select-none">
        <div className="w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-brand mb-2.5 border border-zinc-800/40 shadow-inner">
          <Sparkles size={18} className="animate-pulse text-brand" />
        </div>
        <p className="text-xs font-bold text-text-primary uppercase tracking-wider">No active color</p>
        <p className="text-[10px] text-text-muted mt-1.5 max-w-[240px] leading-relaxed font-medium">
          Pick a color or select one from your saved history to generate smart related variations and gradient inspirations.
        </p>
      </div>
    );
  }

  const { hex } = selectedColor;
  
  // Calculate suggestions
  const shades = getShades(hex);
  const harmonies = getHarmonies(hex);
  const gradients = getGradients(hex);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(key);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleQuickSave = async (hexCode: string, key: string) => {
    const duplicate = savedColors.find(c => c.hex.toLowerCase() === hexCode.toLowerCase());
    if (duplicate) {
      triggerCopyFeedback(key);
      return;
    }
    
    setSelectedColor(hexCode);
    await saveSelectedColor();
    triggerCopyFeedback(key);
  };

  const handleSaveGradientColors = async (c1: string, c2: string, key: string) => {
    setSelectedColor(c1);
    await saveSelectedColor();
    setSelectedColor(c2);
    await saveSelectedColor();
    setSelectedColor(c1);
    
    triggerCopyFeedback(key);
  };

  return (
    <div className="space-y-3.5 animate-slide-up pb-4 select-none">
      
      {/* Active Anchor Card */}
      <div className="flex items-center gap-3.5 p-2.5 bg-surface/90 border border-surface-border rounded-xl shadow-md">
        <div 
          className="w-8 h-8 rounded-lg border border-surface-border shadow-inner flex-shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div className="min-w-0 flex-1">
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Generating options for</span>
          <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wide block mt-0.5">
            {hex}
          </span>
        </div>
        <div className="text-[8.5px] text-text-secondary bg-surface-hover border border-surface-border px-2.5 py-0.5 rounded-md font-bold tracking-wider uppercase">
          Base Anchor
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex bg-black/25 border border-surface-border rounded-lg p-0.5 w-full shadow-inner">
        {(['harmonies', 'shades', 'gradients'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1 rounded-md text-[9.5px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
              activeSubTab === tab
                ? 'bg-brand text-white shadow-md shadow-brand/15'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sub-views container */}
      <div className="pt-1">
        
        {/* TAB 1: HARMONIES */}
        {activeSubTab === 'harmonies' && (
          <div className="space-y-3.5">
            
            {/* Complementary */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 block">Complementary Contrast</span>
              <div className="grid grid-cols-2 gap-2.5">
                {harmonies.complementary.map((item, idx) => {
                  const key = `harmony-comp-${item.hex}-${idx}`;
                  const isCopied = copySuccess[key];
                  const saveKey = `save-comp-${item.hex}-${idx}`;
                  const isSaved = copySuccess[saveKey] || savedColors.some(c => c.hex.toLowerCase() === item.hex.toLowerCase());
                  
                  return (
                    <div 
                      key={key} 
                      onClick={() => setSelectedColor(item.hex)}
                      className="group border border-surface-border bg-surface/40 hover:bg-surface rounded-xl p-1.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md border border-surface-border flex-shrink-0 shadow-sm" style={{ backgroundColor: item.hex }} />
                        <div className="min-w-0">
                          <span className="text-[8px] text-text-muted block font-semibold leading-none mb-0.5 uppercase">{item.name}</span>
                          <span className="text-[10px] font-mono font-bold text-text-primary uppercase truncate block">{item.hex}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(item.hex, key); }}
                          className={`p-1 rounded-md border transition-colors outline-none ${isCopied ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                          title="Copy Hex"
                        >
                          {isCopied ? <Check size={9} /> : <Copy size={9} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickSave(item.hex, saveKey); }}
                          className={`p-1 rounded-md border transition-colors outline-none ${isSaved ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                          title={isSaved ? "Saved" : "Save Color"}
                          disabled={isSaved}
                        >
                          {isSaved ? <BookmarkCheck size={9} /> : <Bookmark size={9} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analogous */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 block">Analogous Palette</span>
              <div className="grid grid-cols-3 gap-2">
                {harmonies.analogous.map((item, idx) => {
                  const key = `harmony-analog-${item.hex}-${idx}`;
                  const isCopied = copySuccess[key];
                  const saveKey = `save-analog-${item.hex}-${idx}`;
                  const isSaved = copySuccess[saveKey] || savedColors.some(c => c.hex.toLowerCase() === item.hex.toLowerCase());

                  return (
                    <div 
                      key={key} 
                      onClick={() => setSelectedColor(item.hex)}
                      className="group border border-surface-border bg-surface/40 hover:bg-surface rounded-xl p-1.5 flex flex-col justify-between cursor-pointer hover:translate-y-[-1px] hover:shadow-md transition-all duration-150 h-[80px]"
                    >
                      <div className="w-full h-6 rounded-md border border-surface-border mb-1 shadow-sm" style={{ backgroundColor: item.hex }} />
                      <span className="text-[8px] text-text-muted truncate font-semibold block uppercase leading-none">{item.name}</span>
                      <span className="text-[9px] font-mono font-bold text-text-primary uppercase truncate block mb-1">{item.hex}</span>
                      
                      <div className="flex items-center gap-1.5 justify-end mt-1 border-t border-surface-border/40 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(item.hex, key); }}
                          className="p-0.5 text-text-muted hover:text-text-primary transition-colors outline-none"
                          title="Copy Hex"
                        >
                          {isCopied ? <Check size={9} className="text-brand" /> : <Copy size={9} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickSave(item.hex, saveKey); }}
                          className="p-0.5 text-text-muted hover:text-text-primary transition-colors outline-none"
                          title={isSaved ? "Saved" : "Save Color"}
                          disabled={isSaved}
                        >
                          {isSaved ? <BookmarkCheck size={9} className="text-brand" /> : <Bookmark size={9} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monochromatic */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 block">Monochromatic Harmonies</span>
              <div className="grid grid-cols-2 gap-2.5">
                {harmonies.monochromatic.map((item, idx) => {
                  const key = `harmony-mono-${item.hex}-${idx}`;
                  const isCopied = copySuccess[key];
                  const saveKey = `save-mono-${item.hex}-${idx}`;
                  const isSaved = copySuccess[saveKey] || savedColors.some(c => c.hex.toLowerCase() === item.hex.toLowerCase());

                  return (
                    <div 
                      key={key} 
                      onClick={() => setSelectedColor(item.hex)}
                      className="group border border-surface-border bg-surface/40 hover:bg-surface rounded-xl p-1.5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md border border-surface-border flex-shrink-0 shadow-sm" style={{ backgroundColor: item.hex }} />
                        <div className="min-w-0">
                          <span className="text-[8px] text-text-muted block font-semibold leading-none mb-0.5 uppercase">{item.name}</span>
                          <span className="text-[10px] font-mono font-bold text-text-primary uppercase truncate block">{item.hex}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(item.hex, key); }}
                          className={`p-1 rounded-md border transition-colors outline-none ${isCopied ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                          title="Copy Hex"
                        >
                          {isCopied ? <Check size={9} /> : <Copy size={9} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickSave(item.hex, saveKey); }}
                          className={`p-1 rounded-md border transition-colors outline-none ${isSaved ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                          title={isSaved ? "Saved" : "Save Color"}
                          disabled={isSaved}
                        >
                          {isSaved ? <BookmarkCheck size={9} /> : <Bookmark size={9} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SHADES */}
        {activeSubTab === 'shades' && (
          <div className="space-y-3">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 block">Lighter & Darker Variations</span>
            <div className="grid grid-cols-1 gap-2">
              {shades.map((item, idx) => {
                const key = `shade-${item.hex}-${idx}`;
                const isCopied = copySuccess[key];
                const saveKey = `save-shade-${item.hex}-${idx}`;
                const isSaved = copySuccess[saveKey] || savedColors.some(c => c.hex.toLowerCase() === item.hex.toLowerCase());
                
                return (
                  <div 
                    key={key} 
                    onClick={() => setSelectedColor(item.hex)}
                    className="group border border-surface-border bg-surface/40 hover:bg-surface rounded-xl p-1.5 pr-2.5 flex items-center justify-between cursor-pointer hover:translate-x-[2px] hover:shadow-md transition-all duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg border border-surface-border flex-shrink-0 shadow-sm" style={{ backgroundColor: item.hex }} />
                      <div>
                        <span className="text-xs font-bold text-text-primary block leading-tight uppercase">{item.name}</span>
                        <span className="text-[10px] font-mono font-semibold text-text-muted uppercase block mt-0.5">{item.hex}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(item.hex, key); }}
                        className={`p-1.5 rounded-lg border transition-colors outline-none ${isCopied ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                        title="Copy Hex"
                      >
                        {isCopied ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickSave(item.hex, saveKey); }}
                        className={`p-1.5 rounded-lg border transition-colors outline-none ${isSaved ? 'bg-brand/15 border-brand/30 text-brand' : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}
                        title={isSaved ? "Saved" : "Save Color"}
                        disabled={isSaved}
                      >
                        {isSaved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: GRADIENTS */}
        {activeSubTab === 'gradients' && (
          <div className="space-y-3">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider px-1 block">Tasteful Gradient Pairings</span>
            <div className="grid grid-cols-2 gap-3">
              {gradients.map((grad, idx) => {
                const copyKey = `grad-copy-${idx}`;
                const saveKey = `grad-save-${idx}`;
                const isCopied = copySuccess[copyKey];
                const isSaved = copySuccess[saveKey];

                return (
                  <div 
                    key={grad.name}
                    className="group border border-surface-border rounded-xl bg-surface/50 overflow-hidden flex flex-col justify-between h-[120px] hover:shadow-lg hover:border-surface-border/80 transition-all duration-150"
                  >
                    {/* Gradient Preview display */}
                    <div 
                      className="w-full flex-1 relative shadow-inner" 
                      style={{ background: grad.css }}
                    >
                      {/* CSS Value overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <span className="text-[8px] font-mono text-zinc-200 select-all leading-relaxed break-all">
                          {grad.css}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions and label */}
                    <div className="p-2 border-t border-surface-border bg-black/10">
                      <span className="text-[9.5px] font-bold text-text-primary truncate block mb-1.5">{grad.name}</span>
                      
                      <div className="flex items-center gap-1 justify-between">
                        {/* Copy Gradient CSS */}
                        <button
                          onClick={() => handleCopy(grad.css, copyKey)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[8.5px] font-bold border transition-colors outline-none ${
                            isCopied 
                              ? 'bg-brand/15 border-brand/30 text-brand' 
                              : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                          }`}
                          title="Copy CSS linear-gradient value"
                        >
                          {isCopied ? <Check size={8} /> : <Copy size={8} />}
                          <span>CSS</span>
                        </button>

                        {/* Save colors */}
                        <button
                          onClick={() => handleSaveGradientColors(grad.color1, grad.color2, saveKey)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[8.5px] font-bold border transition-colors outline-none ${
                            isSaved 
                              ? 'bg-brand/15 border-brand/30 text-brand' 
                              : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                          }`}
                          title="Save both stop colors to Colrion"
                          disabled={isSaved}
                        >
                          {isSaved ? <BookmarkCheck size={8} /> : <Bookmark size={8} />}
                          <span>Save</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
