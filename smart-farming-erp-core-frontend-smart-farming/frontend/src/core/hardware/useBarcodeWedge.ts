// src/core/hardware/useBarcodeWedge.ts
import { useEffect } from 'react';

export function useBarcodeWedge(
  onScan: (code: string) => void,
  { minLength = 6, maxGapMs = 40 } = {}
) {
  useEffect(() => {
    let buf = '';
    let last = 0;

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.matches('input:not([data-scan]), textarea, select, [contenteditable]')) {
        return;
      }

      const now = performance.now();
      if (now - last > maxGapMs) {
        buf = '';
      }
      last = now;

      if (e.key === 'Enter') {
        if (buf.length >= minLength) {
          e.preventDefault();
          onScan(buf);
        }
        buf = '';
      } else if (e.key.length === 1) {
        buf += e.key;
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onScan, minLength, maxGapMs]);
}

