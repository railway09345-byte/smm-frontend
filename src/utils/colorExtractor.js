/**
 * Dynamic Brand Color Extractor & Theme Token Generator
 * Analyzes uploaded logo pixels to extract dominant and complementary colors,
 * then generates high-contrast accessible CSS variable tokens.
 */

// Helper to convert RGB to HEX
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper to convert HEX to RGB
export function hexToRgb(hex) {
  if (!hex) return { r: 99, g: 102, b: 241 };
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper to calculate relative luminance
export function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper to calculate contrast ratio between two hex colors
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper to convert RGB to HSL
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Helper to convert HSL to HEX
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return rgbToHex(r, g, b);
}

/**
 * Extracts dominant color palette from an image source (data URL or Image object)
 * Returns a complete Brand Palette Tokens object
 */
export async function extractPaletteFromImage(imageSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 120;
        const height = 120;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height).data;

        const colorBuckets = {};
        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue;
          if (r > 245 && g > 245 && b > 245) continue;
          if (r < 15 && g < 15 && b < 15) continue;

          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        const sorted = Object.entries(colorBuckets).sort((a, b) => b[1] - a[1]);

        let dominantHex = '#36B987';
        let secondaryHex = '#55D3A0';

        if (sorted.length > 0) {
          const [r1, g1, b1] = sorted[0][0].split(',').map(Number);
          dominantHex = rgbToHex(r1, g1, b1);

          for (let i = 1; i < sorted.length; i++) {
            const [r2, g2, b2] = sorted[i][0].split(',').map(Number);
            const hex2 = rgbToHex(r2, g2, b2);
            const dist = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
            if (dist > 60) {
              secondaryHex = hex2;
              break;
            }
          }
        }

        const tokens = generateTokensFromPrimary(dominantHex, secondaryHex);
        resolve(tokens);
      } catch (err) {
        console.warn('Image color extraction fallback:', err);
        resolve(generateTokensFromPrimary('#36B987', '#55D3A0'));
      }
    };

    img.onerror = () => {
      resolve(generateTokensFromPrimary('#36B987', '#55D3A0'));
    };

    img.src = imageSrc;
  });
}

/**
 * Builds full Brand Palette Tokens from primary and secondary colors
 */
export function generateTokensFromPrimary(primaryHex, customSecondaryHex = null) {
  const rgb = hexToRgb(primaryHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const secondaryHex = customSecondaryHex || hslToHex(hsl.h + 40, Math.min(85, hsl.s + 10), 55);
  const accentHex = hslToHex(hsl.h + 180, Math.min(90, hsl.s + 20), 60);

  const backgroundHex = hslToHex(hsl.h, 25, 6);
  const surfaceHex = hslToHex(hsl.h, 22, 11);
  const surfaceSubtleHex = hslToHex(hsl.h, 20, 16);
  const borderHex = hslToHex(hsl.h, 18, 22);

  const textPrimaryHex = '#f8fafc';
  const textSecondaryHex = '#94a3b8';
  const textMutedHex = '#64748b';

  const contrastWithWhite = getContrastRatio(primaryHex, '#ffffff');
  const buttonTextHex = contrastWithWhite >= 3.5 ? '#ffffff' : '#0f172a';

  const primaryHoverHex = hslToHex(hsl.h, hsl.s, hsl.l > 50 ? hsl.l - 8 : hsl.l + 8);

  return {
    primary: primaryHex,
    primaryHover: primaryHoverHex,
    secondary: secondaryHex,
    accent: accentHex,
    background: backgroundHex,
    surface: surfaceHex,
    surfaceSubtle: surfaceSubtleHex,
    border: borderHex,
    textPrimary: textPrimaryHex,
    textSecondary: textSecondaryHex,
    textMuted: textMutedHex,
    buttonBg: primaryHex,
    buttonText: buttonTextHex,
  };
}

/**
 * Applies theme tokens dynamically to document root CSS variables
 */
export function applyThemeTokens(tokens) {
  if (!tokens || typeof document === 'undefined') return;
  const root = document.documentElement;

  if (tokens.primary) {
    root.style.setProperty('--brand-primary', tokens.primary);
    root.style.setProperty('--color-primary', tokens.primary);
  }
  if (tokens.primaryHover) {
    root.style.setProperty('--brand-primary-hover', tokens.primaryHover);
  }
  if (tokens.secondary) {
    root.style.setProperty('--brand-secondary', tokens.secondary);
    root.style.setProperty('--color-secondary', tokens.secondary);
  }
  if (tokens.accent) {
    root.style.setProperty('--brand-accent', tokens.accent);
    root.style.setProperty('--color-accent', tokens.accent);
  }
  if (tokens.background) {
    root.style.setProperty('--brand-bg', tokens.background);
  }
  if (tokens.surface) {
    root.style.setProperty('--brand-surface', tokens.surface);
  }
  if (tokens.surfaceSubtle) {
    root.style.setProperty('--brand-surface-subtle', tokens.surfaceSubtle);
  }
  if (tokens.border) {
    root.style.setProperty('--brand-border', tokens.border);
  }
  if (tokens.textPrimary) {
    root.style.setProperty('--brand-text-primary', tokens.textPrimary);
  }
  if (tokens.textSecondary) {
    root.style.setProperty('--brand-text-secondary', tokens.textSecondary);
  }
  if (tokens.buttonBg) {
    root.style.setProperty('--brand-btn-bg', tokens.buttonBg);
  }
  if (tokens.buttonText) {
    root.style.setProperty('--brand-btn-text', tokens.buttonText);
  }
}
