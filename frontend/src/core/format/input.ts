// src/core/format/input.ts

/**
 * Hanya angka dan satu pemisah desimal (koma atau titik).
 * Nilai dikembalikan sebagai string bertitik untuk dikirim ke API/Decimal.js.
 */
export function normalizeDecimal(raw: string, maxDp: number = 3): string {
  if (!raw) return '';
  let s = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const [i, ...rest] = s.split('.');
  s = rest.length ? `${i}.${rest.join('').slice(0, maxDp)}` : i;
  return s.replace(/^0+(?=\d)/, '');
}

