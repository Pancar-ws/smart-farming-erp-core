// src/core/format/money.ts
import Decimal from 'decimal.js';

export type Dec = string | number | Decimal | null | undefined;

export const D = (v: Dec): Decimal => {
  if (v === null || v === undefined || v === '') return new Decimal(0);
  return new Decimal(v);
};

const group = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function fmtIdr(v: Dec): string {
  const d = D(v);
  const [i, f] = d.abs().toFixed(2).split('.');
  return `${d.isNegative() ? '-' : ''}Rp${group(i)}${f === '00' ? '' : ',' + f}`;
}

export function fmtKg(v: Dec, dp = 2): string {
  const [i, f] = D(v).toFixed(dp).split('.');
  return `${group(i)}${f ? ',' + f : ''} kg`;
}

export const fmtPct = (v: Dec): string => `${D(v).toFixed(2).replace('.', ',')}%`;

export const sum = (xs: Dec[]): Decimal =>
  xs.reduce<Decimal>((a, x) => a.plus(D(x)), new Decimal(0));

