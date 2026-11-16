// src/core/format/money.test.ts
import { describe, it, expect } from 'vitest';
import { fmtIdr, fmtKg, fmtPct } from './money';

describe('format Rupiah, kg, and percent', () => {
  it('formats Rupiah accurately', () => {
    expect(fmtIdr('32600000.00')).toBe('Rp32.600.000');
    expect(fmtIdr('-1250.50')).toBe('-Rp1.250,50');
  });

  it('formats kg accurately', () => {
    expect(fmtKg('1000')).toBe('1.000,00 kg');
    expect(fmtKg('125.5')).toBe('125,50 kg');
  });

  it('formats percentage with comma', () => {
    expect(fmtPct('17.2589')).toBe('17,26%');
    expect(fmtPct('10')).toBe('10,00%');
  });
});

