// src/features/sorting/massBalance.test.ts
import { describe, it, expect } from 'vitest';
import { massBalance } from './massBalance';

describe('massBalance', () => {
  it('skenario cabai seimbang (input 1000kg -> A:700, B:200, Afkir:100)', () => {
    const m = massBalance('1000', ['700', '200', '100'], '100');
    expect(m.state).toBe('balanced');
    expect(m.diff.toNumber()).toBe(0);
    expect(m.shrinkPct.toFixed(2)).toBe('10.00');
  });

  it('output 990 -> kurang 10 kg', () => {
    const m = massBalance('1000', ['700', '200', '90'], '90');
    expect(m.state).toBe('short');
    expect(m.diff.toString()).toBe('10');
    expect(m.shrinkPct.toFixed(2)).toBe('9.00');
  });

  it('output 1010 -> lebih 10 kg', () => {
    const m = massBalance('1000', ['700', '210', '100'], '100');
    expect(m.state).toBe('over');
    expect(m.diff.toString()).toBe('-10');
  });
});

