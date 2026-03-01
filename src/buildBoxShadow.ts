type ShadowSpec = {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  /**
   * Supported formats:
   * - `#RGB`, `#RRGGBB`, `#RRGGBBAA` (note: `RRGGBBAA`, *not* `AARRGGBB`)
   * - `rgb(r,g,b)`, `rgba(r,g,b,a)`
   * - `transparent`
   */
  color: string;
  /**
   * 0..100 (percent)
   */
  opacity: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const buildBoxShadow = (shadows: ShadowSpec[]) =>
  shadows
    .map(({ x, y, blur, spread = 0, color, opacity }) => {
      const alphaMul = clamp01(opacity / 100);
      return `${x}px ${y}px ${blur}px ${spread}px ${toRgba(color, alphaMul)}`;
    })
    .join(', ');

const toRgba = (input: string, alphaMul: number) => {
  const parsed = parseColor(input);
  if (!parsed) {
    // Fallback: keep original token. (Native side may still parse it.)
    return input;
  }

  const a = clamp01(parsed.a * alphaMul);
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${a})`;
};

const parseColor = (
  input: string
): { r: number; g: number; b: number; a: number } | undefined => {
  const s = input.trim();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  // rgb()/rgba()
  const rgbMatch =
    /^rgba?\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*(?:,\s*([0-9]+(?:\.[0-9]+)?)\s*)?\)$/.exec(
      s
    );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const a = rgbMatch[4] != null ? Number(rgbMatch[4]) : 1;
    if (![r, g, b, a].every((n) => Number.isFinite(n))) return undefined;
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
      a: clamp01(a),
    };
  }

  // hex
  if (s[0] === '#') {
    const hex = s.slice(1);
    const isHex = /^[0-9a-fA-F]+$/.test(hex);
    if (!isHex) return undefined;

    const expand3 = (h: string) =>
      h
        .split('')
        .map((c) => c + c)
        .join('');

    if (hex.length === 3) {
      const full = expand3(hex);
      const bigint = parseInt(full, 16);
      /* eslint-disable no-bitwise */
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
        a: 1,
      };
      /* eslint-enable no-bitwise */
    }

    if (hex.length === 6) {
      const bigint = parseInt(hex, 16);
      /* eslint-disable no-bitwise */
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
        a: 1,
      };
      /* eslint-enable no-bitwise */
    }

    if (hex.length === 8) {
      // RRGGBBAA (matches native parsers in this repo)
      const rrggbb = hex.slice(0, 6);
      const aa = hex.slice(6, 8);
      const rgb = parseInt(rrggbb, 16);
      const a = parseInt(aa, 16) / 255;
      /* eslint-disable no-bitwise */
      return {
        r: (rgb >> 16) & 255,
        g: (rgb >> 8) & 255,
        b: rgb & 255,
        a: clamp01(a),
      };
      /* eslint-enable no-bitwise */
    }
  }

  return undefined;
};
