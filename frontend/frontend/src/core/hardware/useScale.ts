// src/core/hardware/useScale.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import Decimal from 'decimal.js';

const SCALE_RE = /^(ST|US),(GS|NT),\s*([+-]?\d+(?:\.\d+)?)\s*kg$/i;

export function parseScaleLine(line: string) {
  const m = SCALE_RE.exec(line.trim());
  if (!m) return null;
  return {
    stable: m[1].toUpperCase() === 'ST',
    mode: m[2].toUpperCase() as 'GS' | 'NT',
    kg: new Decimal(m[3].replace(/^\+/, '')).toFixed(2),
  };
}

export type ScaleStatus = 'unsupported' | 'idle' | 'connected' | 'error';

export function useScale() {
  const [s, setS] = useState<{
    status: ScaleStatus;
    kg: string | null;
    stable: boolean;
    error?: string;
  }>({
    status: typeof navigator !== 'undefined' && 'serial' in navigator ? 'idle' : 'unsupported',
    kg: null,
    stable: false,
  });

  const port = useRef<any>(null);
  const reader = useRef<any>(null);
  const run = useRef(false);

  const readLoop = useCallback(async (p: any) => {
    const dec = new TextDecoderStream();
    p.readable.pipeTo(dec.writable).catch(() => {});
    reader.current = dec.readable.getReader();
    run.current = true;
    let buf = '', same = 0, last = '';

    try {
      while (run.current) {
        const { value, done } = await reader.current.read();
        if (done) break;
        buf += value;
        let i: number;
        while ((i = buf.indexOf('\n')) >= 0) {
          const parsed = parseScaleLine(buf.slice(0, i));
          buf = buf.slice(i + 1);
          if (!parsed) continue;
          same = parsed.kg === last ? same + 1 : 0;
          last = parsed.kg;
          setS((x) => ({
            ...x,
            kg: parsed.kg,
            stable: parsed.stable && same >= 2,
          }));
        }
      }
    } catch {
      setS((x) => ({
        ...x,
        status: 'error',
        stable: false,
        error: 'Koneksi timbangan terputus.',
      }));
    }
  }, []);

  const open = useCallback(
    async (p: any) => {
      await p.open({
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'hardware',
      });
      port.current = p;
      setS((x) => ({ ...x, status: 'connected', error: undefined }));
      readLoop(p);
    },
    [readLoop]
  );

  const connect = useCallback(async () => {
    if (!('serial' in navigator)) return;
    try {
      const p = await (navigator as any).serial.requestPort();
      await open(p);
    } catch (e: any) {
      if (e?.name !== 'NotFoundError') {
        setS((x) => ({ ...x, status: 'error', error: 'Tidak dapat membuka port timbangan.' }));
      }
    }
  }, [open]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) return;
    (navigator as any).serial.getPorts().then((ps: any[]) => {
      if (ps && ps[0]) open(ps[0]).catch(() => {});
    });

    return () => {
      run.current = false;
      reader.current?.cancel().catch(() => {});
      port.current?.close().catch(() => {});
    };
  }, [open]);

  return { ...s, connect };
}

