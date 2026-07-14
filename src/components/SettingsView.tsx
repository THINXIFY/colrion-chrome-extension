import React, { useRef, useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Settings, 
  Sliders, 
  Trash2, 
  AlertTriangle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportColors, 
    importData, 
    clearRecentColors,
    savedColors,
    palettes,
    copySuccess,
    triggerCopyFeedback,
    setActiveTab
  } = useColorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local notification state
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopyBackup = async () => {
    const backupJson = exportColors('json');
    try {
      await navigator.clipboard.writeText(backupJson);
      triggerCopyFeedback('settings-copy-backup');
      setImportStatus({ type: 'success', message: 'Backup JSON copied to clipboard!' });
    } catch (err) {
      setImportStatus({ type: 'error', message: 'Failed to copy backup to clipboard.' });
    }
  };

  const handleDownloadBackup = () => {
    const backupJson = exportColors('json');
    try {
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `colrion-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportStatus({ type: 'success', message: 'Backup file downloaded successfully!' });
    } catch (err) {
      setImportStatus({ type: 'error', message: 'Failed to download backup file.' });
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = await importData(json);
        if (result.success) {
          setImportStatus({ type: 'success', message: 'Data imported and merged successfully!' });
        } else {
          setImportStatus({ type: 'error', message: result.error || 'Import failed.' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Malformed JSON file. Please check file formatting.' });
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be imported again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistory = async () => {
    if (confirm('Clear the horizontal recents history bar? Saved colors will not be affected.')) {
      await clearRecentColors();
      setImportStatus({ type: 'success', message: 'Recent colors history cleared.' });
    }
  };

  const handleClearAllData = async () => {
    if (confirm('CRITICAL WARNING: This will permanently delete ALL saved colors, custom palettes, and history. Are you absolutely sure?')) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
      } else {
        localStorage.clear();
      }
      // Re-hydrate store
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 animate-slide-up pb-4">
      
      {/* Notifications Banner */}
      {importStatus && (
        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 animate-fade-in relative ${
          importStatus.type === 'success' 
            ? 'bg-brand/10 border-brand/35 text-brand-accent' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {importStatus.type === 'error' && <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />}
          <div className="flex-1 leading-normal pr-4">{importStatus.message}</div>
          <button 
            onClick={() => setImportStatus(null)}
            className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      {/* Group 1: Theme & Colors */}
      <section className="bg-surface/80 border border-surface-border rounded-xl p-3 space-y-3 shadow-md">
        <div className="flex items-center gap-1.5 text-brand border-b border-surface-border/60 pb-1.5">
          <Settings size={12} />
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary">Preferences</h2>
        </div>

        {/* Setting: Theme */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-text-primary block">App Theme</label>
            <span className="text-[10px] text-text-muted">Switch UI appearance mode</span>
          </div>
          <div className="flex bg-black/25 border border-surface-border rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                settings.theme === 'light' 
                  ? 'bg-brand text-white shadow-md shadow-brand/15' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                settings.theme === 'dark' 
                  ? 'bg-brand text-white shadow-md shadow-brand/15' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Setting: Copy Format */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="text-xs font-semibold text-text-primary block">Auto Copy Format</label>
            <span className="text-[10px] text-text-muted">Default clipboard copy template</span>
          </div>
          <select
            value={settings.defaultCopyFormat}
            onChange={(e) => updateSettings({ defaultCopyFormat: e.target.value as any })}
            className="text-[10px] font-bold bg-surface border border-surface-border text-text-primary rounded-lg py-1 px-2.5 outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors"
          >
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
          </select>
        </div>
      </section>

      {/* Group 2: Behavioral Toggles */}
      <section className="bg-surface/80 border border-surface-border rounded-xl p-3 space-y-3 shadow-md">
        <div className="flex items-center gap-1.5 text-brand border-b border-surface-border/60 pb-1.5">
          <Sliders size={12} />
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary">Interface Options</h2>
        </div>

        {/* Checkbox: Compact Mode */}
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(e) => updateSettings({ compactMode: e.target.checked })}
            className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand focus:ring-offset-0 accent-brand bg-surface w-3.5 h-3.5"
          />
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-white transition-colors">Compact View Mode</span>
            <span className="text-[10px] text-text-muted leading-tight block">Decrease padding and dimensions in the color list</span>
          </div>
        </label>

        {/* Checkbox: Animations */}
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={settings.enableAnimations}
            onChange={(e) => updateSettings({ enableAnimations: e.target.checked })}
            className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand focus:ring-offset-0 accent-brand bg-surface w-3.5 h-3.5"
          />
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-white transition-colors">Enable Micro-animations</span>
            <span className="text-[10px] text-text-muted leading-tight block">Tasteful transition effects across menus and list items</span>
          </div>
        </label>

        {/* Checkbox: Reduced Motion */}
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand focus:ring-offset-0 accent-brand bg-surface w-3.5 h-3.5"
          />
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-white transition-colors">Respect Reduced Motion</span>
            <span className="text-[10px] text-text-muted leading-tight block">Force disable all visual movements and slide transitions</span>
          </div>
        </label>

        {/* Checkbox: History */}
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={settings.enableHistory}
            onChange={(e) => updateSettings({ enableHistory: e.target.checked })}
            className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand focus:ring-offset-0 accent-brand bg-surface w-3.5 h-3.5"
          />
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-white transition-colors">Record Pick History</span>
            <span className="text-[10px] text-text-muted leading-tight block">Store intermediate dropper colors in the recents bar</span>
          </div>
        </label>

        {/* Checkbox: Extraction Debug Mode */}
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={settings.debugMode || false}
            onChange={(e) => updateSettings({ debugMode: e.target.checked })}
            className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand focus:ring-offset-0 accent-brand bg-surface w-3.5 h-3.5"
          />
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-white transition-colors">Extraction Debug Mode</span>
            <span className="text-[10px] text-text-muted leading-tight block">Log DOM elements to console and draw dashed outlines around sampled elements</span>
          </div>
        </label>
      </section>

      {/* Group 3: Backup Import & Export */}
      <section className="bg-surface/80 border border-surface-border rounded-xl p-3 space-y-3 shadow-md">
        <div className="flex items-center gap-1.5 text-brand border-b border-surface-border/60 pb-1.5">
          <Download size={12} />
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary">Data Backup & Restore</h2>
        </div>

        <p className="text-[10px] text-text-muted leading-relaxed font-medium">
          Export all colors, palettes, and settings as a JSON file or import a previous backup file to restore.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Copy Backup */}
          <button
            onClick={handleCopyBackup}
            className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover text-text-primary border border-surface-border rounded-lg text-xs font-semibold transition-all active:scale-[0.98] outline-none focus:ring-1 focus:ring-brand"
            title="Copy Backup JSON to clipboard"
          >
            {copySuccess['settings-copy-backup'] ? (
              <>
                <Check size={12} className="text-brand animate-pulse" />
                <span className="text-brand">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          {/* Download File */}
          <button
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover text-text-primary border border-surface-border rounded-lg text-xs font-semibold transition-all active:scale-[0.98] outline-none focus:ring-1 focus:ring-brand"
            title="Download Backup .json file"
          >
            <Download size={12} />
            <span>Download</span>
          </button>
        </div>

        {/* File Import button */}
        <div className="pt-1.5">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2 bg-brand/10 hover:bg-brand/20 border border-brand/25 hover:border-brand/45 text-brand text-xs font-semibold rounded-lg transition-all active:scale-[0.98] outline-none focus:ring-1 focus:ring-brand"
          >
            <Upload size={12} />
            <span>Select & Import Backup File</span>
          </button>
        </div>
      </section>

      {/* Group: Help & About */}
      <section className="bg-surface/80 border border-surface-border rounded-xl p-3 shadow-md">
        <button
          onClick={() => setActiveTab('help')}
          className="w-full flex items-center justify-between py-1 text-left group outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-lg"
          title="Open Help & About Guide"
          aria-label="Open Help and About Guide"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle size={14} className="text-brand group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-semibold text-text-primary block group-hover:text-brand transition-colors">Help & About</span>
              <span className="text-[10px] text-text-muted leading-tight block">Guides, FAQ, keyboard shortcuts & support</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Group 4: Dangerous Actions */}
      <section className="bg-surface/80 border border-surface-border rounded-xl p-3 space-y-2 shadow-md">
        <div className="flex items-center gap-1.5 text-red-400 border-b border-red-950/20 pb-1.5">
          <Trash2 size={12} />
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider">Dangerous Area</h2>
        </div>

        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <span className="text-xs font-semibold text-text-primary block">Clear Recents</span>
            <span className="text-[10px] text-text-muted leading-tight block">Remove history colors bar</span>
          </div>
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-text-secondary hover:text-red-400 border border-surface-border hover:bg-red-500/10 hover:border-red-500/20 rounded-lg transition-all outline-none"
            title="Clear Recents"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-1 border-t border-surface-border/40 pt-2">
          <div>
            <span className="text-xs font-semibold text-text-primary block">Reset Colrion</span>
            <span className="text-[10px] text-text-muted leading-tight block">Delete colors, palettes & preferences</span>
          </div>
          <button
            onClick={handleClearAllData}
            className="px-2.5 py-1 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all outline-none"
          >
            Delete All
          </button>
        </div>
      </section>

      {/* Summary Footer info */}
      <div className="text-center pt-2 text-[9px] text-text-muted space-y-1">
        <p>Colrion Database: {savedColors.length} colors saved across {palettes.length} palettes.</p>
        <p>V3.0.0 &bull; Developer Environment</p>
      </div>

    </div>
  );
};
