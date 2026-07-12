/**
 * This function is injected and executed in the context of the active tab.
 * It must remain completely self-contained (no external imports) because it is serialized as a string.
 */
export function runDomExtract(mode: 'viewport' | 'full' | 'quick', debug = false) {
  function rgbToHex(rgbStr: string): string | null {
    if (!rgbStr || rgbStr === 'transparent' || rgbStr === 'rgba(0, 0, 0, 0)') return null;
    
    // Match rgb(r, g, b) or rgba(r, g, b, a)
    const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!match) return null;
    
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    
    // Ignore highly transparent colors (usually invisible container backgrounds)
    if (a < 0.1) return null;
    
    const toHex = (c: number) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  }

  function getUniqueSelector(el: HTMLElement): string {
    if (el.id) return `#${CSS.escape(el.id)}`;
    
    let path = el.tagName.toLowerCase();
    
    if (el.classList.length > 0) {
      const firstClass = Array.from(el.classList)
        .filter(c => !c.includes(':') && !c.includes('hover') && !c.includes('active') && !c.includes('/'))
        .find(c => /^[a-zA-Z]/.test(c)); // Starts with letter
      
      if (firstClass) {
        try {
          path += `.${CSS.escape(firstClass)}`;
        } catch {
          // ignore escape failures
        }
      }
    }
    
    if (el.parentElement) {
      const siblings = Array.from(el.parentElement.children);
      const index = siblings.indexOf(el);
      path += `:nth-child(${index + 1})`;
    }
    
    return path;
  }

  function extractColorsFromGradient(gradientStr: string): string[] {
    const colors: string[] = [];
    if (!gradientStr || gradientStr === 'none') return colors;
    
    // Extract rgba/rgb colors
    const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/gi;
    let match;
    while ((match = rgbaRegex.exec(gradientStr)) !== null) {
      colors.push(match[0]);
    }
    
    // Extract hex codes
    const hexRegex = /#[a-f0-9]{3,8}/gi;
    const hexMatches = gradientStr.match(hexRegex);
    if (hexMatches) {
      colors.push(...hexMatches);
    }
    
    return colors;
  }

  const elements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
  const rawColors: {
    hex: string;
    rgb: string;
    weight: number;
    type: 'background' | 'text' | 'border' | 'button';
    selector: string;
  }[] = [];

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let visibleCount = 0;
  for (const el of elements) {
    if (mode === 'quick' && visibleCount >= 80) break;
    
    try {
      const style = window.getComputedStyle(el);
      
      // Strict visibility checks (ignore display:none, visibility:hidden, opacity:0)
      if (
        style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0'
      ) continue;
      
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      
      const inViewport = (
        rect.top < viewportHeight &&
        rect.bottom > 0 &&
        rect.left < viewportWidth &&
        rect.right > 0
      );

      if (mode === 'quick') {
        visibleCount++;
      }
      
      // Viewport clipping check if mode is viewport-only or quick-scan
      if ((mode === 'viewport' || mode === 'quick') && !inViewport) {
        continue;
      }

      const area = rect.width * rect.height;
      const selector = getUniqueSelector(el);
      const tagName = el.tagName.toLowerCase();
      
      const isInteractive = (
        tagName === 'button' ||
        tagName === 'a' ||
        el.getAttribute('role') === 'button' ||
        el.getAttribute('role') === 'link' ||
        ['input', 'select', 'textarea'].includes(tagName) ||
        style.cursor === 'pointer' ||
        (el as any).onclick !== undefined
      );

      // DOM nesting depth calculation to prioritize top-layer elements
      let depth = 0;
      let parent = el.parentElement;
      while (parent) {
        depth++;
        parent = parent.parentElement;
      }

      // Unified base multiplier for visual dominance
      let baseMultiplier = 1.0;

      // 1. Viewport priority boost
      if (inViewport) {
        baseMultiplier *= 2.5;
      } else {
        baseMultiplier *= 0.5;
      }

      // 2. Interactivity boost (buttons, links, form inputs)
      if (isInteractive) {
        baseMultiplier *= 4.0;
      }

      // 3. Position boost (above the fold)
      if (rect.top < 1200) {
        baseMultiplier *= 1.4;
      }

      // 4. z-index boost
      const zIndex = parseInt(style.zIndex, 10);
      if (!isNaN(zIndex) && zIndex > 0) {
        baseMultiplier *= (1 + Math.min(zIndex / 100, 1.0));
      }

      // 5. Sticky/Fixed elements boost
      if (style.position === 'fixed' || style.position === 'sticky') {
        baseMultiplier *= 2.0;
      }

      // 6. Heading boost
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
      if (isHeading) {
        baseMultiplier *= 2.0;
      }

      // 7. Large semantic container boost
      const isContainer = ['section', 'article', 'header', 'footer', 'aside', 'main'].includes(tagName) || (tagName === 'div' && area > 50000);
      if (isContainer) {
        baseMultiplier *= 1.5;
      }

      // 8. Nesting depth penalty (prioritizes top-layer elements over deep nests)
      const depthFactor = Math.max(0.3, 1 - depth * 0.04);
      baseMultiplier *= depthFactor;

      // 9. Opacity scaling
      const opacity = parseFloat(style.opacity);
      if (!isNaN(opacity)) {
        if (opacity === 0) continue; // Ignore completely transparent elements
        baseMultiplier *= opacity;
      }

      // Debug mode: temporarily outline sampled elements on page
      if (debug) {
        try {
          const prevOutline = el.style.outline;
          el.style.outline = '1px dashed rgba(99, 102, 241, 0.75)';
          setTimeout(() => {
            try {
              el.style.outline = prevOutline;
            } catch {}
          }, 3000);
        } catch {}
      }

      // 1. Background color / Gradient extraction
      const bgImg = style.backgroundImage || style.background;
      let hasGradient = false;
      
      if (bgImg && bgImg !== 'none' && bgImg.includes('gradient')) {
        const gradientColors = extractColorsFromGradient(bgImg);
        if (gradientColors.length > 0) {
          hasGradient = true;
          const gradientWeight = (area * baseMultiplier) / gradientColors.length;
          
          for (const gradColor of gradientColors) {
            const gradHex = rgbToHex(gradColor) || (gradColor.startsWith('#') ? gradColor.toLowerCase() : null);
            if (gradHex) {
              rawColors.push({
                hex: gradHex,
                rgb: gradColor,
                weight: gradientWeight,
                type: isInteractive ? 'button' : 'background',
                selector: `${selector}::type::background`
              });
              
              if (debug) {
                console.log(`[Colrion Debug] Gradient Stop Extracted:`, {
                  element: tagName,
                  selector: `${selector}::type::background`,
                  color: gradHex,
                  weight: gradientWeight
                });
              }
            }
          }
        }
      }

      // Fallback to standard background color if no gradient is present
      if (!hasGradient) {
        const bg = style.backgroundColor;
        const bgHex = rgbToHex(bg);
        if (bgHex) {
          let weight = area * baseMultiplier;
          if (isInteractive) weight *= 1.5;
          
          rawColors.push({
            hex: bgHex,
            rgb: bg,
            weight,
            type: isInteractive ? 'button' : 'background',
            selector: `${selector}::type::background`
          });

          if (debug) {
            console.log(`[Colrion Debug] Background Color Extracted:`, {
              element: tagName,
              selector: `${selector}::type::background`,
              color: bgHex,
              weight
            });
          }
        }
      }

      // 2. Text color extraction
      let hasDirectText = false;
      let textContentLength = 0;
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim() || '';
          if (text.length > 0) {
            hasDirectText = true;
            textContentLength += text.length;
          }
        }
      }

      if (hasDirectText) {
        const fg = style.color;
        const fgHex = rgbToHex(fg);
        if (fgHex) {
          const fontSize = parseFloat(style.fontSize) || 12;
          let weight = textContentLength * fontSize * 8 * baseMultiplier;
          if (isInteractive) weight *= 1.5;
          
          rawColors.push({
            hex: fgHex,
            rgb: fg,
            weight,
            type: 'text',
            selector: `${selector}::type::text`
          });

          if (debug) {
            console.log(`[Colrion Debug] Text Color Extracted:`, {
              element: tagName,
              selector: `${selector}::type::text`,
              color: fgHex,
              weight
            });
          }
        }
      }

      // 3. Border color extraction
      const borderTopWidth = parseFloat(style.borderTopWidth) || 0;
      const borderLeftWidth = parseFloat(style.borderLeftWidth) || 0;
      if (borderTopWidth > 0 || borderLeftWidth > 0) {
        const border = style.borderTopColor || style.borderLeftColor || style.borderColor;
        const borderHex = rgbToHex(border);
        if (borderHex) {
          const perimeter = (rect.width + rect.height) * 2;
          let weight = perimeter * Math.max(borderTopWidth, borderLeftWidth) * 1.5 * baseMultiplier;
          
          rawColors.push({
            hex: borderHex,
            rgb: border,
            weight,
            type: 'border',
            selector: `${selector}::type::border`
          });

          if (debug) {
            console.log(`[Colrion Debug] Border Color Extracted:`, {
              element: tagName,
              selector: `${selector}::type::border`,
              color: borderHex,
              weight
            });
          }
        }
      }
    } catch {
      // Safeguard against cross-origin frames or broken DOM states
    }
  }

  return rawColors;
}
