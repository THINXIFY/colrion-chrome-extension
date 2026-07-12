import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Trash2, 
  Edit2, 
  Moon, 
  Globe, 
  Play
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import { Palette } from '../types';

interface DarkModePaletteCardProps {
  palette: Palette;
}

export const DarkModePaletteCard: React.FC<DarkModePaletteCardProps> = ({ palette }) => {
  const { 
    savedColors, 
    deletePalette, 
    renamePalette,
    applyDarkPalettePreset,
    copySuccess,
    triggerCopyFeedback,
    activeWebTabUrl
  } = useColorStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(palette.name);

  // Get colors belonging to this palette
  const colors = savedColors.filter(c => c.paletteId === palette.id);

  // Handle renaming
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === palette.name) {
      setIsEditing(false);
      return;
    }
    const success = await renamePalette(palette.id, newName);
    if (success) {
      setIsEditing(false);
    }
  };

  // Handle deleting
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the dark palette "${palette.name}"? This will delete all colors inside it.`)) {
      deletePalette(palette.id);
    }
  };

  // Copy all colors as a string
  const handleCopyAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (colors.length === 0) return;
    const hexList = colors.map(c => c.hex).join(', ');
    try {
      await navigator.clipboard.writeText(hexList);
      triggerCopyFeedback(`copy-all-${palette.id}`);
    } catch (err) {
      console.error('Failed to copy colors:', err);
    }
  };

  // Quick apply preset
  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await applyDarkPalettePreset(palette.id);
    triggerCopyFeedback(`apply-${palette.id}`);
  };

  const isCopiedAll = copySuccess[`copy-all-${palette.id}`];
  const isApplied = copySuccess[`apply-${palette.id}`];

  // Show a preview of 3 to 5 colors
  const previewColors = colors.slice(0, 5);

  // Compute domain matching for smart memory highlights
  const currentDomain = React.useMemo(() => {
    if (!activeWebTabUrl) return '';
    try {
      const urlObj = new URL(activeWebTabUrl);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch (e) {
      return '';
    }
  }, [activeWebTabUrl]);

  const isDomainMatch = React.useMemo(() => {
    return currentDomain && palette.sourceUrl && (palette.sourceUrl.toLowerCase() === currentDomain);
  }, [currentDomain, palette.sourceUrl]);

  return (
    <div className={`overflow-hidden rounded-2xl shadow-md transition-all duration-300 ${
      isDomainMatch 
        ? 'bg-indigo-950/20 border border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-emerald-500/60' 
        : 'bg-surface/65 border border-surface-border/80 hover:border-brand/40'
    }`}>
      {/* Card Header (Clickable to Expand) */}
      <div 
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-center justify-between cursor-pointer select-none relative"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Moon Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${
            isDomainMatch 
              ? 'bg-emerald-950/45 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-indigo-950/50 border-indigo-500/20 text-indigo-400'
          }`}>
            <Moon size={14} className="animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xs font-bold bg-surface border border-brand/50 text-text-primary rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-brand w-36"
                  maxLength={25}
                  autoFocus
                />
                <button type="submit" className="text-brand hover:text-brand-hover p-0.5">
                  <Check size={12} />
                </button>
                <button type="button" onClick={() => { setNewName(palette.name); setIsEditing(false); }} className="text-text-muted hover:text-text-primary p-0.5">
                  <span className="text-[10px] font-bold">X</span>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-text-primary tracking-wide truncate max-w-[150px]">
                  {palette.name}
                </span>
                
                {/* Pulsating site match indicator or standard Dark Mode badge */}
                {isDomainMatch ? (
                  <span className="text-[7.5px] font-extrabold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-1.5 py-0.5 rounded uppercase leading-none tracking-wider flex-shrink-0 animate-pulse">
                    Saved for this site
                  </span>
                ) : (
                  <span className="text-[7.5px] font-extrabold bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 px-1.5 py-0.5 rounded uppercase leading-none tracking-wider flex-shrink-0">
                    Dark Mode
                  </span>
                )}
              </div>
            )}

            {/* Subtitle with site domain or timestamp */}
            <div className="flex items-center gap-1.5 text-[8.5px] text-text-muted mt-1 leading-none font-medium">
              {palette.sourceUrl ? (
                <>
                  <Globe size={9} className="text-text-muted" />
                  <span className="truncate max-w-[120px]">{palette.sourceUrl}</span>
                  <span>&bull;</span>
                </>
              ) : null}
              <span>{new Date(palette.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right side controls & Color preview dots */}
        <div className="flex items-center gap-3 flex-shrink-0 pl-2">
          {/* Swatch Preview circles */}
          {!isExpanded && previewColors.length > 0 && (
            <div className="flex items-center -space-x-1.5 bg-black/20 px-1.5 py-1 rounded-lg border border-surface-border/40">
              {previewColors.map((color) => (
                <div 
                  key={color.id} 
                  className="w-3.5 h-3.5 rounded-full border border-surface/90 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          )}

          {/* Action buttons (only when NOT editing) */}
          {!isEditing && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {/* Apply/Run Preview */}
              <button
                onClick={handleApply}
                className={`p-1.5 rounded-md border transition-all duration-150 outline-none ${
                  isApplied
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-500/10 animate-pulse'
                    : 'bg-surface border-surface-border text-indigo-450 hover:text-brand hover:bg-surface-hover'
                }`}
                title="Apply Dark Theme to page (Re-apply)"
              >
                {isApplied ? <Check size={11} className="animate-pulse" /> : <Play size={11} fill="currentColor" />}
              </button>

              {/* Copy all */}
              <button
                onClick={handleCopyAll}
                className={`p-1.5 rounded-md border transition-all outline-none ${
                  isCopiedAll
                    ? 'bg-brand/10 border-brand/20 text-brand'
                    : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="Copy all HEX codes"
              >
                {isCopiedAll ? <Check size={11} /> : <Copy size={11} />}
              </button>

              {/* Rename */}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none"
                title="Rename Preset"
              >
                <Edit2 size={11} />
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md bg-surface border border-surface-border text-text-muted hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors outline-none"
                title="Delete Preset"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}

          {/* Expand/Collapse Chevron */}
          <div className="text-text-muted hover:text-text-primary transition-colors pl-0.5">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Accordion Expanded Content */}
      {isExpanded && (
        <div className="border-t border-surface-border/50 bg-black/10 px-4 py-3 space-y-2 animate-slide-down">
          
          <div className="flex items-center justify-between text-[8.5px] uppercase tracking-wider text-text-muted font-extrabold pb-1 border-b border-surface-border/30">
            <span>Color Swatch & Role</span>
            <span>HEX / RGB</span>
          </div>

          {colors.length === 0 ? (
            <div className="text-center py-2 text-[10px] text-text-muted">
              No colors inside this palette.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {colors.map((color) => {
                const colorCopyKey = `color-card-${color.id}`;
                const isColorCopied = copySuccess[colorCopyKey];

                const handleColorCopy = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(color.hex);
                    triggerCopyFeedback(colorCopyKey);
                  } catch (err) {
                    console.error('Failed to copy color:', err);
                  }
                };

                return (
                  <div 
                    key={color.id}
                    className="flex items-center justify-between bg-surface/40 hover:bg-surface border border-surface-border/40 rounded-xl p-2 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch */}
                      <div 
                        className="w-7 h-7 rounded-lg border border-surface-border shadow-inner flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.hex} (${color.label})`}
                      />

                      <div className="min-w-0">
                        {/* Name/Label */}
                        <span className="text-[10.5px] font-bold text-text-primary uppercase tracking-wide truncate block">
                          {color.label || 'Color'}
                        </span>
                        
                        {/* Role label badge */}
                        {color.role && (
                          <span className="inline-block text-[7px] font-bold bg-surface-hover border border-surface-border px-1.5 py-0.5 rounded leading-none text-text-muted mt-0.5 uppercase tracking-wide">
                            {color.role}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Values info */}
                      <div className="text-right">
                        <span className="text-[9.5px] font-mono font-bold text-text-secondary uppercase block leading-none">
                          {color.hex}
                        </span>
                        <span className="text-[8px] text-text-muted block mt-0.5 font-mono leading-none">
                          {color.rgb}
                        </span>
                      </div>

                      {/* Individual copy button */}
                      <button
                        onClick={handleColorCopy}
                        className={`p-1.5 rounded-md border transition-colors outline-none ${
                          isColorCopied 
                            ? 'bg-brand/15 border-brand/35 text-brand' 
                            : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                        }`}
                        title="Copy Hex"
                      >
                        {isColorCopied ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
