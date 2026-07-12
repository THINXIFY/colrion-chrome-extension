# Colrion Chrome Extension

Colrion is a premium, modern browser extension for developers and designers that lets you pick colors from webpages, preview them, copy HEX/RGB/HSL codes instantly, and organize them in custom palettes.

Built using **React**, **TypeScript**, **Tailwind CSS**, **Vite**, and **Chrome Extension Manifest V3**.

---

- **EyeDropper Integration**: Pick any pixel color from standard webpages using Chrome's native EyeDropper API.
- **Intelligent Page Color Extractor**: Scans the stylesheets and DOM layout hierarchy of any webpage to extract its actual design system colors. Performs intelligent K-Means clustering and perceptual RGB distance classification to group colors into a "Dominant Palette" (matched to design roles like background, text, primary, secondary, and interactive accents) and isolates minor elements under "No Match Colors".
- **Vibrant Dark Mode Generator**: Automatically generates a high-contrast, accessible dark mode palette from any scanned light-themed webpage. Employs advanced HSL color space rotation, relative luminance mapping, and adjustable intensity profiles (Pitch Black, Modern Dark, Deep Slate) to instantly craft dark variants.
- **Visual Color Tone Identifier**: Automatically classifies the selected color lightness into a clean tone category (e.g. Very Light, Light, Medium, Dark, Deep) inside the active preview card.
- **Dynamic Theming**: Instant runtime Light/Dark theme switching through CSS variable classes (`.light-theme`) integrated with Tailwind CSS.
- **Smart Related Colors (Generator)**: Generates shades (lighter/darker variants), complementary, analogous, and monochromatic harmonies.
- **CSS Linear Gradients**: Pairs your active color with matching variants to render linear gradients. Copy the CSS rule directly or save both constituent colors instantly.
- **Drag-to-Reorder Sorting**: Reorder colors by dragging cards in the list. Order persists automatically across browser restarts.
- **JSON Backups Import/Export**: Securely export your entire database (colors, custom palettes, settings) as a single JSON file, or restore a backup file safely using schema merge verification.
- **Productivity Hotkeys**:
  - `1`: Switch to Colors view.
  - `2`: Switch to Generator/Suggestions view.
  - `3`: Switch to Settings view.
  - `P` / `p`: Trigger EyeDropper.
  - `F` / `f`: Toggle Favorites-only filter.
  - `Escape`: Close menus, cancel rename form, cancel label edits.

---

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS
- **State Management**: Zustand
- **Build System**: Vite
- **API Target**: Chrome Extension Manifest V3

---

## File Structure

```text
/
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration with relative assets base path
├── tailwind.config.js         # Custom dark-first theme settings mapped to CSS variables
├── postcss.config.js          # PostCSS configuration for Tailwind
├── index.html                 # Main popup entry document
├── public/
│   ├── manifest.json          # Chrome Extension Manifest V3 configuration
│   ├── icon16.png             # 16x16 icon file
│   ├── icon48.png             # 48x48 icon file
│   └── icon128.png            # 128x128 icon file
├── scripts/
│   └── generate-icons.js      # Programmatic script to generate icons from base64
└── src/
    ├── app/
    │   └── App.tsx            # App container (view panels orchestrator & hotkey listener)
    ├── components/
    │   ├── Button.tsx         # Reusable styling component
    │   ├── Header.tsx         # Branded header with segmented navigation tabs
    │   ├── ColorPreview.tsx   # Swatch card with Copy Badges, Palette Selector, and Favorite Toggle
    │   ├── ColorList.tsx      # Draggable list supporting compact mode & favorites filter
    │   ├── ColorGenerator.tsx # Suggestions panel (harmonies, shades, gradients)
    │   └── SettingsView.tsx   # Option toggles, backups export, and schema file import
    ├── lib/
    │   ├── clustering.ts      # K-Means clustering and perceptual distance layout role categorization
    │   ├── color.ts           # Hex/RGB/HSL conversion and tone utility helper
    │   ├── colorUtils.ts      # Mathematical harmony rotations and gradient generation
    │   └── storage.ts         # Chrome storage local API with localStorage fallback & migration
    ├── store/
    │   └── useColorStore.ts   # Zustand state store managing pickers, CRUD, settings, and sorting
    ├── types/
    │   └── index.ts           # Extended TypeScript interfaces
    ├── index.css              # Custom themes CSS variables, animations, and scrollbars
    └── main.tsx               # React mount script
```

---

## Development and Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
Run the following command in the project root:
```bash
npm install
```

### 2. Run in Local Browser Tab (Development Mode)
You can run the popup in a local browser tab to test search, inline edits, and palettes:
```bash
npm run dev
```

### 3. Build for Production
To bundle the Chrome extension assets for loading into Chrome, run:
```bash
npm run build
```
This compiles the TypeScript code, builds Tailwind CSS, and outputs the production bundle to the `dist/` directory.

---

## Loading Colrion into Google Chrome

To install the extension in your local Chrome browser:

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions/` by typing it in the address bar.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist`** directory inside the project root folder.
6. The Colrion extension icon will now appear in your extensions list. Pin it to your toolbar for easy access!

---

## Permissions & Manifest

Colrion operates under strict privacy and permissions hygiene:
- **`activeTab`**: Temporary host page scripting access allowed purely to inject success toast notifications when a color is picked.
- **`scripting`**: Required to inject toast nodes directly into host tabs for immediate user feedback.
- **`storage`**: Used to save themes, settings, recent picks, custom palettes, and saved swatches persistently.

No external network requests are made, and no user search data is collected.

---

## Future Extensibility Note

- **Palette Syncing**: Can be easily connected to cloud databases (like Firebase) to sync color lists across multiple devices.
- **Web App Exports**: Integration with Figma plugin API or Adobe Creative Cloud can be introduced using the standard JSON backup payload schema.

---

## License

MIT License. See the repository notes for more details.
Developed by [THINXIFY](https://thinxify.com).

---

## Release Notes

### Version 1.0.0 (Initial Production Release)
- **EyeDropper Integration**: Standardized on-demand pixel color picking with clipboard sync and success toasts.
- **Intelligent Page Color Extractor**: Scans page DOM elements and CSS stylesheets using K-Means clustering to construct a design system palette.
- **Vibrant Dark Mode Generator**: Implements HSL space rotation and relative luminance mapping to auto-generate dark mode variants from page color extractions.
- **Tone Category Classifier**: Automatic tone category identification (Very Light, Light, Medium, Dark, Deep) on selected preview swatches.
- **Draggable Reordering**: Full drag-and-drop sorting support for custom palettes and saved colors.
- **Backup & settings**: Schema-validated JSON backup imports/exports, accessibility settings, and theme toggling.
#   c o l r i o n - c h r o m e - e x t e n s i o n  
 "# colrion-chrome-extension" 
