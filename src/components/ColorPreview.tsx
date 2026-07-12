import React, { useState } from 'react';
import { Copy, Check, Bookmark, BookmarkCheck, Heart } from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import { getColorShadeDescription, hslToHex, hexToRgb, rgbToHsl, getColorTone } from '../lib/color';

export const ColorPreview: React.FC = () => {
  const { 
    selectedColor, 
    saveSelectedColor, 
    copySuccess, 
    triggerCopyFeedback, 
    palettes,
    savedColors,
    toggleFavoriteColor,
    settings,
    setSelectedColor
  } = useColorStore();

  const [targetPaletteId, setTargetPaletteId] = useState<string>('');

  if (!selectedColor) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-surface-border rounded-2xl bg-surface/30 text-center animate-fade-in my-1 select-none">
        <div className="w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-text-muted mb-2.5 border border-zinc-800/40 shadow-inner">
          <Bookmark size={16} className="opacity-40" />
        </div>
        <p className="text-xs font-semibold text-text-secondary">No active color</p>
        <p className="text-[10px] text-text-muted mt-1 max-w-[220px] leading-relaxed">
          Use the color dropper above to pick a color from the page.
        </p>
      </div>
    );
  }

  const { hex, rgb, hsl } = selectedColor;

  const rgbObj = hexToRgb(hex);
  const hslObj = rgbObj ? rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b) : { h: 0, s: 0, l: 50 };

  // Generate 5 shades: l-20%, l-10%, l (current), l+10%, l+20%
  const shadesList = [-20, -10, 0, 10, 20].map(diff => {
    const newL = Math.max(5, Math.min(95, hslObj.l + diff));
    const shadeHex = hslToHex(hslObj.h, hslObj.s, newL);
    return {
      hex: shadeHex,
      lightness: newL,
      isCurrent: diff === 0
    };
  });

  const handleCopy = async (text: string, format: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(format);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const formats = [
    { label: 'HEX', value: hex, key: 'hex' },
    { label: 'RGB', value: rgb, key: 'rgb' },
    { label: 'HSL', value: hsl, key: 'hsl' },
  ];

  const hasSaved = copySuccess['save-success'];

  // Look up if color is saved in list to determine favorite state
  const savedItem = savedColors.find(item => item.hex.toLowerCase() === hex.toLowerCase());
  const isFavorite = savedItem?.favorite || false;

  const handleSave = async () => {
    await saveSelectedColor(targetPaletteId || undefined);
    setTargetPaletteId('');
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedItem) {
      await toggleFavoriteColor(savedItem.id);
    } else {
      // Auto-save first, then toggle favorite state
      await saveSelectedColor(targetPaletteId || undefined);
      const freshlySaved = useColorStore.getState().savedColors.find(
        c => c.hex.toLowerCase() === hex.toLowerCase()
      );
      if (freshlySaved) {
        await toggleFavoriteColor(freshlySaved.id);
      }
      setTargetPaletteId('');
    }
  };

  return (
    <div className="p-3.5 border border-surface-border rounded-2xl bg-surface/95 shadow-xl shadow-black/30 animate-slide-up space-y-3.5 select-none">
      {/* Primary Info Row: Swatch, HEX label, Save trigger */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          
          {/* Swatch & Heart Favorite Overlay */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-14 h-14 rounded-xl border border-surface-border shadow-lg shadow-black/35 flex-shrink-0"
              style={{ backgroundColor: hex }}
            />
            {/* Quick Heart Toggle Button */}
            <button
              onClick={handleFavoriteToggle}
              className={`absolute -top-1.5 -left-1.5 p-1 rounded-full border shadow-md hover:scale-110 active:scale-90 transition-all outline-none ${
                isFavorite
                  ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/20'
                  : 'bg-surface border-surface-border text-text-muted hover:text-rose-450 hover:border-rose-500/40'
              }`}
              title={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
              aria-label={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
            >
              <Heart size={9} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Active color label */}
          <div className="min-w-0">
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Active Color</span>
            <span className="text-sm font-mono font-bold text-text-primary uppercase tracking-wide truncate block mt-0.5">
              {hex}
            </span>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[9px] text-brand font-bold tracking-wide bg-brand/10 px-2 py-0.5 rounded-md shadow-sm">
                {getColorShadeDescription(hex)}
              </span>
              <span className="text-[9px] text-text-secondary font-semibold tracking-wide bg-surface-hover/80 border border-surface-border/60 px-2 py-0.5 rounded-md shadow-sm">
                {getColorTone(hex)}
              </span>
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Palette dropdown */}
          {!hasSaved && !savedItem && palettes.length > 0 && (
            <select
              value={targetPaletteId}
              onChange={(e) => setTargetPaletteId(e.target.value)}
              className="text-[10px] bg-surface border border-surface-border text-text-secondary rounded-lg py-1.5 px-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors font-semibold"
            >
              <option value="">No Palette</option>
              {palettes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSave}
            disabled={hasSaved || !!savedItem}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border outline-none active:scale-[0.97] ${
              hasSaved || savedItem
                ? 'bg-brand/10 border-brand/20 text-brand'
                : 'bg-brand hover:bg-brand-hover border-brand/35 hover:border-brand-hover text-white shadow-md shadow-brand/10 hover:shadow-brand/20'
            }`}
          >
            {hasSaved || savedItem ? (
              <>
                <BookmarkCheck size={12} className="text-brand" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark size={12} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Color Shades Bar */}
      <div className="pt-2 border-t border-surface-border/40 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Shades & Tints</span>
          <span className="text-[8.5px] text-brand font-bold uppercase tracking-wider">Click to Select</span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          {shadesList.map((shade, idx) => (
            <button
              key={`${shade.hex}-${idx}`}
              onClick={() => setSelectedColor(shade.hex)}
              className={`flex-1 h-6 rounded-md border transition-all hover:scale-105 active:scale-95 outline-none relative group/shade-btn ${
                shade.isCurrent 
                  ? 'border-brand ring-1 ring-brand scale-[1.02] shadow-sm shadow-brand/10' 
                  : 'border-surface-border hover:border-text-secondary'
              }`}
              style={{ backgroundColor: shade.hex }}
              title={`Select shade ${shade.hex}`}
              aria-label={`Select shade ${shade.hex}`}
            >
              {shade.isCurrent && (
                <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/40" />
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-zinc-200 rounded opacity-0 pointer-events-none group-hover/shade-btn:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                {shade.hex.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Badges copy segment */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border/40 justify-between">
        {formats.map((f) => {
          const isCopied = copySuccess[f.key];
          const isDefault = settings.defaultCopyFormat === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleCopy(f.value, f.key)}
              className={`flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border outline-none hover:scale-[1.01] active:scale-[0.98] transition-all ${
                isCopied
                  ? 'bg-brand/15 border-brand/30 text-brand font-semibold shadow-sm'
                  : isDefault
                    ? 'bg-brand/5 border-brand/35 text-text-primary shadow-sm hover:bg-surface-hover/80'
                    : 'bg-surface/50 border-surface-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-hover/60'
              }`}
              title={`Copy ${f.label}${isDefault ? ' (Default copy format)' : ''}`}
            >
              <span className="font-bold text-[8px] text-text-muted uppercase">{f.label}</span>
              <span className="truncate max-w-[62px] text-text-secondary font-semibold">{f.value}</span>
              {isCopied ? (
                <Check size={10} className="flex-shrink-0 text-brand" />
              ) : (
                <Copy size={10} className={`flex-shrink-0 ${isDefault ? 'text-brand opacity-60' : 'opacity-40'} hover:opacity-100`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
