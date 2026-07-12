import React, { useState } from 'react';
import { Copy, Trash2, Check, Edit2, Folder, HelpCircle, Heart, GripVertical } from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import { ColorItem } from '../types';

export const ColorList: React.FC = () => {
  const { 
    savedColors, 
    palettes, 
    selectedPaletteId, 
    searchQuery, 
    deleteColor, 
    copySuccess, 
    triggerCopyFeedback, 
    setSelectedColor,
    updateColorMetadata,
    assignColorToPalette,
    toggleFavoriteColor,
    favoritesOnly,
    setFavoritesOnly,
    reorderColors,
    settings
  } = useColorStore();

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editPaletteId, setEditPaletteId] = useState<string>('');

  // Drag state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleCopy = async (e: React.MouseEvent, colorItem: ColorItem) => {
    e.stopPropagation();
    
    // Respect configured auto copy format
    let text = colorItem.hex;
    if (settings.defaultCopyFormat === 'rgb') text = colorItem.rgb;
    else if (settings.defaultCopyFormat === 'hsl') text = colorItem.hsl;
    
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(colorItem.id);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingId === id) setEditingId(null);
    await deleteColor(id);
  };

  const startEditing = (e: React.MouseEvent, color: ColorItem) => {
    e.stopPropagation();
    setEditingId(color.id);
    setEditLabel(color.label || '');
    setEditNote(color.note || '');
    setEditPaletteId(color.paletteId || '');
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEditing = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await updateColorMetadata(id, editLabel, editNote);
    await assignColorToPalette(id, editPaletteId || undefined);
    setEditingId(null);
  };

  const handleFavoriteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleFavoriteColor(id);
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    // Rearrange within the current view array
    const updatedFiltered = [...filtered];
    const [draggedItem] = updatedFiltered.splice(draggedIdx, 1);
    updatedFiltered.splice(targetIdx, 0, draggedItem);

    // Map relative indices of the dragged and target items back to the master savedColors list
    const masterUpdated = [...savedColors];
    const masterDraggedIdx = masterUpdated.findIndex(c => c.id === draggedItem.id);
    const targetItem = filtered[targetIdx];
    const masterTargetIdx = masterUpdated.findIndex(c => c.id === targetItem.id);

    if (masterDraggedIdx !== -1 && masterTargetIdx !== -1) {
      const [item] = masterUpdated.splice(masterDraggedIdx, 1);
      masterUpdated.splice(masterTargetIdx, 0, item);
      await reorderColors(masterUpdated);
    }

    setDraggedIdx(null);
  };

  // Filter colors logic
  const filtered = savedColors.filter((color) => {
    // 0. Filter out dark mode palette colors from the general 'all' list
    if (selectedPaletteId === 'all' && color.paletteId) {
      const parentPalette = palettes.find(p => p.id === color.paletteId);
      if (parentPalette?.isDarkMode) return false;
    }

    // 1. Filter by palette
    if (selectedPaletteId !== 'all') {
      if (color.paletteId !== selectedPaletteId) return false;
    }

    // 2. Filter by favorites
    if (favoritesOnly && !color.favorite) return false;

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesHex = color.hex.toLowerCase().includes(query);
      const matchesRgb = color.rgb.toLowerCase().includes(query);
      const matchesHsl = color.hsl.toLowerCase().includes(query);
      const matchesLabel = color.label?.toLowerCase().includes(query) || false;
      const matchesNote = color.note?.toLowerCase().includes(query) || false;
      return matchesHex || matchesRgb || matchesHsl || matchesLabel || matchesNote;
    }

    return true;
  });

  const activePalette = palettes.find(p => p.id === selectedPaletteId);

  // 1. Onboarding Empty State
  if (savedColors.length === 0) {
    return (
      <div className="flex flex-col p-4 bg-surface/35 border border-surface-border/60 rounded-xl animate-fade-in space-y-3 select-none">
        <div className="flex items-center gap-2 text-brand">
          <HelpCircle size={14} className="flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Getting Started</span>
        </div>
        <div className="text-[11px] text-text-secondary space-y-2 leading-relaxed font-medium">
          <p>
            1. Click the primary <strong className="text-text-primary">Pick color from page</strong> button to activate the screen dropper.
          </p>
          <p>
            2. Select any pixel on your webpage, then click <strong className="text-text-primary">Save</strong> in the preview card.
          </p>
          <p>
            3. <strong className="text-text-primary">Tip:</strong> Create custom Palettes (like &quot;Brand UI&quot;) using the filter bar to keep your design colors grouped and searchable!
          </p>
        </div>
      </div>
    );
  }

  // 2. Filter Empty State
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/20 border border-surface-border/40 rounded-xl animate-fade-in select-none">
        <p className="text-xs font-semibold text-text-secondary">No matching colors</p>
        <p className="text-[10px] text-text-muted mt-1 max-w-[200px] leading-normal font-medium">
          {favoritesOnly 
            ? 'You have not favorited any colors in this palette.' 
            : 'Try refining your search text or switching palettes.'}
        </p>
      </div>
    );
  }

  // Compact Mode Styling variables
  const isCompact = settings.compactMode;

  return (
    <div className="space-y-2 select-none">
      
      {/* Title & Favorites Filter Badge */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted font-bold px-1">
        <div className="flex items-center gap-1.5">
          <span>
            {activePalette ? `Palette: ${activePalette.name}` : 'Saved Colors'} ({filtered.length})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Favorites Filter button */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors outline-none focus:ring-1 focus:ring-brand/40 ${
              favoritesOnly
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-text-muted hover:text-text-secondary'
            }`}
            title={favoritesOnly ? "Show All Colors" : "Filter by Favorites"}
            aria-label="Toggle favorites filtering"
          >
            <Heart size={8} fill={favoritesOnly ? "currentColor" : "none"} className={favoritesOnly ? 'text-rose-450' : ''} />
            <span>Favorites</span>
          </button>
          
          {!isCompact && <span className="text-[8px] text-text-muted font-semibold">Drag to sort</span>}
        </div>
      </div>

      {/* Colors scroll container */}
      <div className="space-y-2 pr-0.5">
        {filtered.map((color, index) => {
          const isCopied = copySuccess[color.id];
          const isEditing = editingId === color.id;
          const assignedPalette = palettes.find(p => p.id === color.paletteId);
          const isFav = color.favorite || false;

          return (
            <div
              key={color.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => !isEditing && setSelectedColor(color.hex)}
              className={`group border rounded-xl cursor-pointer transition-all duration-150 bg-surface/90 hover:bg-surface flex items-center justify-between shadow-sm hover:shadow ${
                isEditing 
                  ? 'border-brand/35 ring-1 ring-brand/20 p-3 flex-col items-stretch space-y-2.5 bg-surface' 
                  : isCompact
                    ? 'border-surface-border hover:border-text-muted/30 p-1.5 pl-2 hover:translate-x-[2px]'
                    : 'border-surface-border hover:border-text-muted/30 p-2 pl-2 hover:translate-x-[2px]'
              }`}
            >
              {isEditing ? (
                /* Inline Editor Form */
                <form onSubmit={(e) => saveEditing(e, color.id)} onClick={(e) => e.stopPropagation()} className="space-y-2.5 w-full">
                  <div className="flex items-center justify-between pb-1 border-b border-surface-border/50">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Edit Color Info</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-surface-border shadow-inner" style={{ backgroundColor: color.hex }} />
                      <span className="text-[10px] font-mono font-bold text-text-primary uppercase">{color.hex}</span>
                    </div>
                  </div>

                  {/* Input: Label */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase block">Label / Name</label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g. Primary Blue"
                      maxLength={30}
                      className="w-full text-xs bg-surface border border-surface-border text-text-primary rounded-lg py-1.5 px-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40"
                    />
                  </div>

                  {/* Input: Note */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase block">Note</label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="e.g. Used for active navigation tabs"
                      maxLength={60}
                      className="w-full text-xs bg-surface border border-surface-border text-text-primary rounded-lg py-1.5 px-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40"
                    />
                  </div>

                  {/* Dropdown: Assign Palette */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase block">Assign to Palette</label>
                    <select
                      value={editPaletteId}
                      onChange={(e) => setEditPaletteId(e.target.value)}
                      className="w-full text-xs bg-surface border border-surface-border text-text-primary rounded-lg py-1.5 px-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40"
                    >
                      <option value="">No Palette</option>
                      {palettes.filter(p => !p.isDarkMode).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-2 pt-1.5 border-t border-surface-border/40">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-2.5 py-1.5 border border-surface-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-[10px] font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-[10px] font-bold rounded-lg transition-all active:scale-[0.97]"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* Standard & Compact List Card View */
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Reorder drag handle */}
                    <div className="text-text-muted opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing p-0.5 flex-shrink-0 transition-opacity">
                      <GripVertical size={11} />
                    </div>

                    {/* Swatch & Favorite indicator overlay */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`rounded-lg border border-surface-border shadow-inner ${
                          isCompact ? 'w-6 h-6' : 'w-9 h-9'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                      {isFav && (
                        <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                    </div>
                    
                    {/* Label hierarchy */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-text-primary truncate uppercase tracking-wide ${
                          isCompact ? 'text-[11px]' : 'text-xs'
                        }`}>
                          {color.label || color.hex}
                        </span>
                        
                        {/* Palette Badge */}
                        {assignedPalette && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-surface-hover border border-surface-border text-text-secondary">
                            <Folder size={7} className="text-text-muted" />
                            {assignedPalette.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Sub-label coordinates */}
                      {!isCompact && (
                        <div className="text-[10px] font-mono text-text-muted mt-0.5 flex items-center gap-2">
                          {color.label && <span className="uppercase">{color.hex}</span>}
                          <span className="truncate">{color.rgb}</span>
                        </div>
                      )}
                      
                      {/* Note snippet */}
                      {color.note && !isCompact && (
                        <span className="text-[9px] text-text-secondary mt-0.5 truncate leading-tight font-medium">
                          {color.note}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (visible on card hover/focus) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                    {/* Favorite action */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, color.id)}
                      className={`p-1.5 rounded-md transition-colors border outline-none ${
                        isFav
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                          : 'bg-surface border border-surface-border text-text-muted hover:text-rose-450 hover:bg-surface-hover'
                      }`}
                      title={isFav ? "Remove Favorite" : "Favorite Color"}
                    >
                      <Heart size={11} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => handleCopy(e, color)}
                      className={`p-1.5 rounded-md transition-colors border outline-none ${
                        isCopied
                          ? 'bg-brand/10 border-brand/20 text-brand'
                          : 'bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover'
                      }`}
                      title={`Copy ${settings.defaultCopyFormat.toUpperCase()}`}
                    >
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => startEditing(e, color)}
                      className="p-1.5 rounded-md bg-surface border border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors outline-none"
                      title="Edit Color Details"
                    >
                      <Edit2 size={11} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, color.id)}
                      className="p-1.5 rounded-md bg-surface border border-surface-border text-text-muted hover:text-red-450 hover:bg-red-500/10 hover:border-red-500/20 transition-colors outline-none"
                      title="Delete Color"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
