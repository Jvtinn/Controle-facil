export const FABY_FESTAS_DEFAULTS = {
  // Valores neutros para uma instalação nova. A identidade da loja só aparece
  // depois que a dona cadastra ou configura a empresa neste navegador.
  storeName: 'Controle Fácil',
  welcomeMessage: 'Organize sua loja com simplicidade',
  fontScale: 1,
  colors: {
    pink: '#db2777',
    yellow: '#facc15',
    blue: '#1d4ed8',
  },
  logoDataUrl: '',
} as const;

export const BRAND_STORAGE_KEYS = {
  storeName: 'facil_estoque_store_name',
  welcomeMessage: 'facil_estoque_welcome',
  logo: 'facil_estoque_logo',
  fontScale: 'facil_estoque_font_scale',
  colors: 'facil_estoque_brand_colors',
} as const;

export type BrandColors = typeof FABY_FESTAS_DEFAULTS.colors;

export function getStoredBrandColors(): BrandColors {
  try {
    const stored = localStorage.getItem(BRAND_STORAGE_KEYS.colors);
    if (stored) return { ...FABY_FESTAS_DEFAULTS.colors, ...JSON.parse(stored) };
  } catch {
    // Usa a identidade padrão se o valor salvo estiver corrompido.
  }
  return { ...FABY_FESTAS_DEFAULTS.colors };
}
