import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Keyboard,
  Sparkles,
  Mail,
  Bug,
  Lightbulb,
  Github,
  Shield,
  FileText,
  Info,
  Star,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useColorStore } from '../store/useColorStore';
import {
  PRODUCT_NAME,
  DEVELOPER_NAME,
  OFFICIAL_WEBSITE_URL,
  SUPPORT_EMAIL,
  GITHUB_REPOSITORY_URL,
  GITHUB_ISSUES_URL,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  CHROME_WEB_STORE_URL
} from '../config/product';

type Subview =
  | 'main'
  | 'getting-started'
  | 'faq'
  | 'shortcuts'
  | 'whats-new'
  | 'support'
  | 'github'
  | 'privacy'
  | 'terms'
  | 'about';

export const HelpView: React.FC = () => {
  const { setActiveTab, triggerCopyFeedback, copySuccess } = useColorStore();
  const [activeSubview, setActiveSubview] = useState<Subview>('main');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Retrieve extension version
  let version = '1.0.0';
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    try {
      version = chrome.runtime.getManifest().version;
    } catch (e) {
      console.warn('Failed to fetch version from manifest:', e);
    }
  }

  // Handle Escape key navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubview !== 'main') {
          e.preventDefault();
          handleBack();
        } else {
          setActiveTab('settings');
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeSubview, setActiveTab]);

  const openSubview = (subview: Subview, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setActiveSubview(subview);
  };

  const handleBack = () => {
    setActiveSubview('main');
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 50);
  };

  const openExternalUrl = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyText = async (text: string, feedbackKey: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback(feedbackKey);
      setToastMessage(message);
      setTimeout(() => setToastMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy support email:', err);
    }
  };

  // Pre-fill bug report on GitHub
  const getBugReportUrl = () => {
    const body = `**Colrion Version:** ${version}
**Chrome Version:** (Please fill in)
**Operating System:** Windows
**Steps to Reproduce:**
1. 
2. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots / Additional Context:**
`;
    return `${GITHUB_ISSUES_URL}?title=[Bug]:%20&body=${encodeURIComponent(body)}`;
  };

  // Pre-fill feature request on GitHub
  const getFeatureRequestUrl = () => {
    const body = `**Feature Description:**
(Describe the feature you would like to see)

**Problem It Solves:**
(What issue or inconvenience does this feature address?)

**Suggested Workflow / Implementation:**
(How do you visualize using this feature?)

**Optional Examples / References:**
`;
    return `${GITHUB_ISSUES_URL}?title=[Feature%20Request]:%20&body=${encodeURIComponent(body)}`;
  };

  const CHANGELOG = [
    {
      version: '1.0.0',
      date: 'July 2026',
      features: [
        'Native EyeDropper color picking',
        'HEX, RGB, and HSL color values',
        'Intelligent webpage color extraction',
        'Dominant palette organization',
        'Dark mode palette generation',
        'Color tone identification',
        'Related color generation',
        'Shades and color harmonies',
        'CSS gradients',
        'Favorites',
        'Custom palettes',
        'Drag-and-drop color sorting',
        'JSON import and export',
        'Light and dark themes',
        'Keyboard shortcuts'
      ]
    }
  ];

  const FAQS = [
    {
      q: 'What is Colrion?',
      a: 'Colrion is a modern, premium Chrome extension for picking colors from webpages, copying HEX, RGB and HSL values, extracting website palettes, generating related colors, and organizing reusable collections.'
    },
    {
      q: 'How do I pick a color from a webpage?',
      a: 'Click "Pick color from page" or press "P". Your cursor will turn into an EyeDropper magnifier. Hover over any pixel on the webpage and click to select it.'
    },
    {
      q: 'How do I extract colors from a website?',
      a: 'Switch to the "Extract" tab, select viewport or full DOM scan mode, and click "Scan Page Elements" to extract and categorize all dominant design colors.'
    },
    {
      q: 'How do I copy a HEX color?',
      a: 'Click on any saved color swatch card or the HEX code itself to copy it. You can change your default auto-copy format (HEX, RGB, HSL) in the settings.'
    },
    {
      q: 'Can I copy RGB and HSL values?',
      a: 'Yes. Selecting any color opens a preview panel displaying HEX, RGB, and HSL values, each accompanied by a copy button.'
    },
    {
      q: 'Where are my saved colors stored?',
      a: "All collections, custom palettes, and user configurations are stored locally in your browser using Chrome's extension local storage."
    },
    {
      q: 'Does Colrion require an account?',
      a: 'No account, profile, registration, or internet connection is required. Colrion runs completely local to ensure your privacy.'
    },
    {
      q: 'Does Colrion collect or sell my data?',
      a: 'Absolutely not. Colrion has zero tracking, zero telemetry, and zero network calls. Your color collections remain private to your local browser environment.'
    },
    {
      q: 'Can Colrion work offline?',
      a: 'Yes. Since all storage, utilities, color extraction, and theme builders run in-browser, it has complete offline support.'
    },
    {
      q: 'Why might the EyeDropper not work on some pages?',
      a: 'Chrome extension APIs are blocked on browser system pages (such as chrome:// settings, history, or extension dashboards) and the official Chrome Web Store due to browser security policies.'
    },
    {
      q: 'Can I organize colors into custom palettes?',
      a: 'Yes. Create custom palettes using the "+ New" button, select a palette, and save picked colors or drag-and-drop saved colors directly into it.'
    },
    {
      q: 'Can I reorder saved colors?',
      a: 'Yes. Simply drag and drop any saved color card or palette pill within the main Colors dashboard to customize your order layout.'
    },
    {
      q: 'How do I back up my colors and settings?',
      a: 'Go to Settings, and under "Data Backup & Restore", click "Download" to save a JSON file, or copy the raw JSON payload to your clipboard.'
    },
    {
      q: 'How do I restore a backup?',
      a: 'Go to Settings, click "Select & Import Backup File", and upload a previously exported Colrion backup JSON file. It will safely merge into your database.'
    },
    {
      q: 'How do I report a bug?',
      a: 'Use the "Report a Bug" action in the Help section to open a pre-templated issue form on our GitHub issues page.'
    },
    {
      q: 'How do I request a feature?',
      a: 'Use the "Request a Feature" action in the Help section to open a structured suggestion template on our GitHub repository.'
    }
  ];

  return (
    <div className="space-y-3.5 animate-slide-up pb-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar select-none text-text-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-brand/20 text-brand-accent px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg shadow-black/50 z-50 flex items-center gap-1.5 animate-fade-in">
          <Check size={11} className="text-brand-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Help Dashboard */}
      {activeSubview === 'main' && (
        <div className="space-y-3.5">
          {/* Header */}
          <div className="bg-surface border border-surface-border rounded-xl p-3.5 flex items-center justify-between shadow-md">
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-text-primary uppercase transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand rounded"
            >
              <ChevronLeft size={12} />
              <span>Settings</span>
            </button>
            <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider">Help & About</span>
          </div>

          {/* Cards List */}
          <div className="space-y-2">
            <button
              onClick={(e) => openSubview('getting-started', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <BookOpen size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Getting Started</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Learn the main Colrion workflow and features</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('faq', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <HelpCircle size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Frequently Asked Questions</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Answers to common questions and troubleshooting</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('shortcuts', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Keyboard size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Keyboard Shortcuts</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Speed up your workflow with hotkeys</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('whats-new', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Sparkles size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">What's New</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Check the latest updates and release changelog</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('support', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Mail size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Contact Support</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Get in touch with the development team</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => openExternalUrl(getBugReportUrl())}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Bug size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Report a Bug</span>
                    <ExternalLink size={10} className="text-text-muted group-hover:text-brand" />
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5">Submit a bug report on our GitHub issues page</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => openExternalUrl(getFeatureRequestUrl())}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Lightbulb size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Request a Feature</span>
                    <ExternalLink size={10} className="text-text-muted group-hover:text-brand" />
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5">Suggest a new feature or improvement</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('github', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Github size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">GitHub Repository</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">View project code, license, and star the repo</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('privacy', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Shield size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Privacy Summary</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Read our plain-language privacy policies</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('terms', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <FileText size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Terms & Disclaimer</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Review Colrion usage terms and disclaimer</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={(e) => openSubview('about', e)}
              className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                  <Info size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">About Colrion</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Version, developer details, and license info</span>
                </div>
              </div>
              <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Rate Colrion Button */}
            {!CHROME_WEB_STORE_URL ? (
              <div className="opacity-45 cursor-not-allowed bg-surface/50 border border-surface-border rounded-xl p-3 flex items-center justify-between text-left select-none">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text-muted">
                    <Star size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-muted">Rate Colrion</span>
                      <span className="text-[7px] font-extrabold bg-zinc-800 text-zinc-400 px-1 rounded uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <span className="text-[10px] text-text-muted block mt-0.5">Share your feedback on the Chrome Web Store</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openExternalUrl(CHROME_WEB_STORE_URL)}
                className="w-full bg-surface hover:bg-surface-hover border border-surface-border rounded-xl p-3 flex items-center justify-between text-left transition-all active:scale-[0.99] group outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                    <Star size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block group-hover:text-brand transition-colors">Rate Colrion</span>
                    <span className="text-[10px] text-text-muted block mt-0.5">Share your feedback on the Chrome Web Store</span>
                  </div>
                </div>
                <ChevronRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Getting Started Screen */}
      {activeSubview === 'getting-started' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Getting Started</h3>
          </div>

          <div className="space-y-3">
            <div className="bg-surface/60 border border-surface-border rounded-xl p-3 space-y-1.5">
              <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">1. Pick a color from a webpage</span>
              <ol className="list-decimal pl-4 text-[10.5px] text-text-secondary space-y-1 leading-normal">
                <li>Open Colrion from the Chrome toolbar.</li>
                <li>Click <span className="font-semibold text-text-primary">Pick color from page</span> (or press <kbd className="px-1 bg-surface border border-surface-border rounded text-[9px] font-mono">P</kbd>).</li>
                <li>Select any visible pixel with the EyeDropper.</li>
                <li>Return to Colrion to view the selected color.</li>
                <li>Copy the HEX, RGB, or HSL value from the preview panel.</li>
              </ol>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-3 space-y-1">
              <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">2. Extract webpage colors</span>
              <p className="text-[10.5px] text-text-secondary leading-normal">
                Scan pages instantly to compile complete site-wide dominant color palettes. Custom-tailor analysis with Viewport-only scanning or deep Full-DOM crawls, label specific color roles, and save collections into custom palettes.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-3 space-y-1">
              <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">3. Save and organize colors</span>
              <p className="text-[10.5px] text-text-secondary leading-normal">
                Save color formulas directly, assign personalized semantic labels, append designer notes, and pin your favorites. Drag and drop saved color swatches or palette filters to organize your workspaces.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-3 space-y-1">
              <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">4. Generate related colors</span>
              <p className="text-[10.5px] text-text-secondary leading-normal">
                Explore dynamic combinations such as monochromatic shades, complementary harmonies, analogous gradients, and triadic relationships. Design, adjust, and copy CSS gradients with one click.
              </p>
            </div>

            <div className="bg-surface/60 border border-surface-border rounded-xl p-3 space-y-1">
              <span className="text-[10.5px] font-bold text-brand uppercase tracking-wider block">5. Backup and restore</span>
              <p className="text-[10.5px] text-text-secondary leading-normal">
                Maintain ownership of your assets. Export your databases (colors, palettes, and configurations) into JSON files under Settings, or upload backups to sync them across browser environments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. FAQ Accordion Screen */}
      {activeSubview === 'faq' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="bg-surface/60 border border-surface-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-[11px] font-bold hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      size={12}
                      className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-90 text-brand' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${index}`}
                      className="px-3.5 pb-3 pt-1 text-[10.5px] text-text-secondary leading-relaxed border-t border-surface-border/30 bg-black/10"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Keyboard Shortcuts Screen */}
      {activeSubview === 'shortcuts' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Keyboard Shortcuts</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3">
            <p className="text-[10px] text-text-muted leading-normal">
              Utilize global keyboard hotkeys when the extension popup is open to streamline your workspace navigation.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Open Colors View</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">1</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Open Generator View</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">2</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Open Extract View</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">3</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Open Settings View</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">4</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Open Dark Mode View</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">5</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Trigger EyeDropper</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">P</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-border/40">
                <span className="text-[10.5px] font-semibold text-text-secondary">Toggle Favorites Filter (on Colors View)</span>
                <kbd className="px-2 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[10px] font-mono font-bold text-text-primary">F</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[10.5px] font-semibold text-text-secondary">Cancel Edit / Blur Fields</span>
                <kbd className="px-1.5 py-0.5 bg-black/40 border border-surface-border rounded shadow text-[9px] font-mono font-bold text-text-primary">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. What's New Screen */}
      {activeSubview === 'whats-new' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">What's New</h3>
          </div>

          <div className="space-y-3">
            {CHANGELOG.map((release) => (
              <div key={release.version} className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-surface-border/40 pb-1.5">
                  <span className="text-xs font-extrabold text-brand tracking-wider">VERSION {release.version}</span>
                  <span className="text-[9px] text-text-muted font-bold uppercase">{release.date}</span>
                </div>
                <ul className="list-disc pl-4 text-[10.5px] text-text-secondary space-y-1 leading-normal">
                  {release.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Contact Support Screen */}
      {activeSubview === 'support' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Contact Support</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow">
            <p className="text-[10px] text-text-muted leading-relaxed font-medium">
              Having issues or want to provide feedback? Our support team is ready to assist.
            </p>

            <div className="space-y-2.5 border-t border-surface-border/40 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Email Support</span>
                <span className="text-[11px] font-mono font-semibold text-text-primary">{SUPPORT_EMAIL}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Developer</span>
                <span className="text-[10.5px] font-semibold text-text-primary">{DEVELOPER_NAME}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Official Website</span>
                <span className="text-[10.5px] font-semibold text-text-primary">{OFFICIAL_WEBSITE_URL}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border/40">
              <button
                onClick={() => openExternalUrl(`mailto:${SUPPORT_EMAIL}`)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <Mail size={12} />
                <span>Email Support</span>
              </button>
              <button
                onClick={() => handleCopyText(SUPPORT_EMAIL, 'copy-support-email', 'Support email copied!')}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                {copySuccess['copy-support-email'] ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
                <span>Copy Email</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openExternalUrl(OFFICIAL_WEBSITE_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>Visit website</span>
                <ExternalLink size={10} className="text-text-muted" />
              </button>
              <button
                onClick={() => openExternalUrl(GITHUB_REPOSITORY_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>View GitHub</span>
                <ExternalLink size={10} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. GitHub Screen */}
      {activeSubview === 'github' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">GitHub Repository</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow">
            <div className="flex items-center gap-2 border-b border-surface-border/40 pb-2">
              <Github size={18} className="text-brand" />
              <div>
                <span className="text-xs font-bold text-text-primary block">{PRODUCT_NAME} Extension</span>
                <span className="text-[9px] text-text-muted">Developed by {DEVELOPER_NAME}</span>
              </div>
            </div>

            <p className="text-[10px] text-text-muted leading-relaxed font-medium">
              Access the repository to review source files, read license agreements, file tickets, or contribute to building better color design utilities.
            </p>

            <div className="space-y-2 border-t border-surface-border/40 pt-2.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary font-semibold">License:</span>
                <span className="text-text-primary font-bold">MIT License</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary font-semibold">Current Version:</span>
                <span className="text-text-primary font-bold">{version}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-border/40">
              <button
                onClick={() => openExternalUrl(GITHUB_REPOSITORY_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>View Repository</span>
                <ExternalLink size={10} />
              </button>
              <button
                onClick={() => openExternalUrl(getBugReportUrl())}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>Report an Issue</span>
                <ExternalLink size={10} className="text-text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openExternalUrl(getFeatureRequestUrl())}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>Request Feature</span>
                <ExternalLink size={10} className="text-text-muted" />
              </button>
              <button
                onClick={() => openExternalUrl(GITHUB_REPOSITORY_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10.5px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span>Star on GitHub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Privacy Screen */}
      {activeSubview === 'privacy' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Privacy Policy</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow text-[10.5px] leading-relaxed text-text-secondary">
            <div>
              <span className="font-bold text-text-primary block text-[11px] border-b border-surface-border/40 pb-1 mb-1">Your Data</span>
              <p>
                Colrion stores saved colors, custom palettes, favorite states, and layout settings locally in your browser's extension storage (`chrome.storage.local`).
              </p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px] border-b border-surface-border/40 pb-1 mb-1">No Accounts Required</span>
              <p>
                Colrion requires no accounts, no profiles, and no authentication. We have no access to your databases.
              </p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px] border-b border-surface-border/40 pb-1 mb-1">Zero Tracking</span>
              <p>
                Colrion makes no external API requests, carries zero analytics scripts, and does not monitor usage behavior or color picking choices.
              </p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px] border-b border-surface-border/40 pb-1 mb-1">Permissions Explained</span>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-semibold text-text-primary">activeTab:</span> Used temporarily to query the tab URL/ID during active color extraction scan requests.</li>
                <li><span className="font-semibold text-text-primary">scripting:</span> Used to inject the smart color sampler script and copy toast elements into active page layouts.</li>
                <li><span className="font-semibold text-text-primary">storage:</span> Used to persist your color libraries, palettes, and preferences settings locally.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-surface-border/40 flex justify-between items-center flex-wrap gap-2 text-[10px]">
              <span>Questions? Email: {SUPPORT_EMAIL}</span>
              <button
                onClick={() => openExternalUrl(PRIVACY_POLICY_URL)}
                className="flex items-center gap-1 text-brand hover:text-brand-hover font-bold outline-none"
              >
                <span>Read Full Policy</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Terms Screen */}
      {activeSubview === 'terms' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Terms of Service</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3 shadow text-[10.5px] leading-relaxed text-text-secondary max-h-[350px] overflow-y-auto custom-scrollbar">
            <div>
              <span className="font-bold text-text-primary block text-[11px]">1. Acceptance of Use</span>
              <p>By using the Colrion extension, you agree to comply with and be bound by these simplified terms of use.</p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px]">2. Permitted Use</span>
              <p>Colrion is intended for personal and professional color-sampling and design-related purposes. Any attempt to exploit, reverse engineer, or inject malicious elements into Colrion is strictly prohibited.</p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px]">3. Intellectual Property</span>
              <p>All source files, artwork, branding, logo designs, and assets related to Colrion are protected under intellectual property rights held by {DEVELOPER_NAME} and project code contributors.</p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px]">4. Software Availability</span>
              <p>Colrion is provided "as is" and "as available". We do not guarantee continuous, uninterrupted access to all code services or compatibility with future browser configurations.</p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px]">5. Warranty Disclaimer</span>
              <p>We make no representations or warranties of any kind regarding Colrion's accuracy, compliance, or reliability. Usage of the extension is entirely at your own risk.</p>
            </div>

            <div>
              <span className="font-bold text-text-primary block text-[11px]">6. Limitation of Liability</span>
              <p>In no event shall {DEVELOPER_NAME} be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the loss of saved colors, backup corruption, or service malfunction.</p>
            </div>

            <div className="pt-2.5 border-t border-surface-border/40 flex justify-between items-center flex-wrap gap-2 text-[10px]">
              <span>Email: {SUPPORT_EMAIL}</span>
              <button
                onClick={() => openExternalUrl(TERMS_URL)}
                className="flex items-center gap-1 text-brand hover:text-brand-hover font-bold outline-none"
              >
                <span>Full Terms & Conditions</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. About Screen */}
      {activeSubview === 'about' && (
        <div className="space-y-3.5 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-2.5">
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-brand"
              aria-label="Back to Help menu"
            >
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">About Colrion</h3>
          </div>

          <div className="bg-surface border border-surface-border rounded-xl p-3.5 space-y-3.5 shadow flex flex-col items-center text-center">
            {/* Logo */}
            <img src="/logo.png" alt="Colrion Logo" className="h-10 w-auto object-contain" />

            <div className="space-y-1">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-text-primary">{PRODUCT_NAME}</h4>
              <span className="text-[9.5px] text-brand font-bold uppercase tracking-wider">Version {version}</span>
            </div>

            <p className="text-[10.5px] text-text-secondary leading-relaxed max-w-[280px]">
              Colrion is a modern Chrome extension for picking colors from webpages, copying HEX, RGB and HSL values, extracting website palettes, generating related colors and organizing reusable color collections.
            </p>

            <div className="w-full border-t border-surface-border/40 pt-3 space-y-1.5 text-left text-[10.5px] text-text-secondary">
              <div className="flex justify-between">
                <span>Developer:</span>
                <span className="text-text-primary font-bold">{DEVELOPER_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span>Website:</span>
                <button
                  onClick={() => openExternalUrl(OFFICIAL_WEBSITE_URL)}
                  className="text-brand hover:text-brand-hover hover:underline font-semibold"
                >
                  thinxify.com
                </button>
              </div>
              <div className="flex justify-between">
                <span>Support:</span>
                <button
                  onClick={() => openExternalUrl(`mailto:${SUPPORT_EMAIL}`)}
                  className="text-brand hover:text-brand-hover hover:underline font-semibold"
                >
                  {SUPPORT_EMAIL}
                </button>
              </div>
              <div className="flex justify-between">
                <span>GitHub Repository:</span>
                <button
                  onClick={() => openExternalUrl(GITHUB_REPOSITORY_URL)}
                  className="text-brand hover:text-brand-hover hover:underline font-semibold text-right max-w-[170px] truncate"
                >
                  GitHub Project
                </button>
              </div>
              <div className="flex justify-between">
                <span>License:</span>
                <span className="text-text-primary font-bold">MIT License</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-surface-border/40">
              <button
                onClick={() => openExternalUrl(OFFICIAL_WEBSITE_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-[10px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>Visit Website</span>
                <ExternalLink size={10} />
              </button>
              <button
                onClick={() => openExternalUrl(GITHUB_REPOSITORY_URL)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-surface hover:bg-surface-hover border border-surface-border text-text-primary rounded-lg text-[10px] font-bold transition-all active:scale-[0.98] outline-none"
              >
                <span>View GitHub</span>
                <ExternalLink size={10} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
