/**
 * Optical form helpers: normalize shorthand typing (e.g. -075 → -0.75) and parse for API.
 */

/** "-075" / "075" → "-0.75" / "0.75" when the value has no decimal point. */
export function normalizeOpticalDecimalString(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (s.includes('.')) return s;
  const m = s.match(/^(-?)0(\d{2})$/);
  if (m) {
    const sign = m[1];
    const frac = m[2];
    return `${sign}0.${frac}`;
  }
  return s;
}

export function parseOptionalDecimal(
  raw: string,
  opts: { min: number; max: number }
): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = normalizeOpticalDecimalString(raw).trim();
  if (!t) return { ok: true, value: null };
  const n = parseFloat(t);
  if (Number.isNaN(n)) return { ok: false, error: 'Nombre invalide' };
  if (n < opts.min || n > opts.max) {
    return { ok: false, error: `Entre ${opts.min} et ${opts.max}` };
  }
  return { ok: true, value: n };
}

export function parseOptionalAxis(
  raw: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return { ok: false, error: 'Axe invalide' };
  if (n < 0 || n > 180) return { ok: false, error: 'Axe entre 0 et 180' };
  return { ok: true, value: n };
}

/** PD fields: mm, typically 40–80 */
export function parseOptionalPd(
  raw: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  const n = parseFloat(t);
  if (Number.isNaN(n)) return { ok: false, error: 'Valeur invalide' };
  if (n < 40 || n > 80) return { ok: false, error: 'EP entre 40 et 80 mm' };
  return { ok: true, value: n };
}
