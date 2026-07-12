import React from 'react';
import { Sparkles, Settings, ListCollapse, Layers, Moon } from 'lucide-react';
import { useColorStore } from '../store/useColorStore';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab } = useColorStore();

  const tabs = [
    { id: 'colors', label: 'Colors', icon: <ListCollapse size={13} />, title: 'View Saved Colors & Palettes (Shortcut: 1)' },
    { id: 'generator', label: 'Generator', icon: <Sparkles size={13} />, title: 'Smart suggestions & harmonies (Shortcut: 2)' },
    { id: 'extract', label: 'Extract', icon: <Layers size={13} />, title: 'Extract dominant UI colors from page (Shortcut: 3)' },
    { id: 'darkmode', label: 'Dark Mode', icon: <Moon size={13} />, title: 'Intelligent Web Dark Mode Generator (Shortcut: 5)' },
    { id: 'settings', label: 'Settings', icon: <Settings size={13} />, title: 'Preferences & Backup (Shortcut: 4)' }
  ] as const;

  return (
    <header 
      className="flex items-center justify-between border-b border-surface-border px-4 py-3 bg-surface/95 backdrop-blur-sm select-none"
      role="banner"
    >
      {/* Brand Logo */}
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="Colrion Logo" 
          className="h-9 w-auto object-contain hover:scale-105 active:scale-[0.98] transition-all"
        />
      </div>
      
      {/* View Segmented Navigation Control */}
      <nav 
        className="flex bg-black/25 border border-surface-border rounded-lg p-0.5 shadow-inner"
        role="tablist"
        aria-label="Navigation Tabs"
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${t.id}-panel`}
              id={`tab-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded-md outline-none transition-all focus-visible:ring-1 focus-visible:ring-brand active:scale-[0.97] ${
                isActive
                  ? 'bg-brand text-white shadow-md shadow-brand/15'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/40'
              }`}
              title={t.title}
            >
              {t.icon}
              <span className="sr-only sm:not-sr-only">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
