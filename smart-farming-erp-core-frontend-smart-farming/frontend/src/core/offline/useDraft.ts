// src/core/offline/useDraft.ts
// CACA - Auto-Save Draft ke LocalStorage (Jobdesc: fitur Auto-Save Draft)
// Generic hook untuk menyimpan & memulihkan draft form ke LocalStorage secara otomatis.

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDraftOptions<T> {
  /** Key unik di LocalStorage */
  key: string;
  /** Interval auto-save dalam milidetik (default: 15.000 = 15 detik) */
  intervalMs?: number;
  /** Callback saat draft berhasil dipulihkan */
  onRestore?: (data: T) => void;
}

interface UseDraftReturn<T> {
  /** Simpan draft secara manual */
  saveDraft: (data: T) => void;
  /** Hapus draft (setelah submit berhasil) */
  clearDraft: () => void;
  /** Waktu terakhir draft disimpan (ISO string) */
  savedAt: string | null;
  /** Apakah ada draft tersimpan */
  hasDraft: boolean;
}

export function useDraft<T extends object>({
  key,
  intervalMs = 15_000,
  onRestore,
}: UseDraftOptions<T>): UseDraftReturn<T> {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef<T | null>(null);

  // Simpan draft ke LocalStorage
  const saveDraft = useCallback(
    (data: T) => {
      try {
        const record = { data, savedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(record));
        setSavedAt(record.savedAt);
        setHasDraft(true);
        dataRef.current = data;
      } catch {
        // localStorage penuh atau private mode — abaikan
      }
    },
    [key]
  );

  // Hapus draft setelah sukses submit
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setSavedAt(null);
      setHasDraft(false);
      dataRef.current = null;
    } catch {
      // abaikan
    }
  }, [key]);

  // Muat draft saat mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const record = JSON.parse(raw) as { data: T; savedAt: string };
      if (record?.data && record?.savedAt) {
        setSavedAt(record.savedAt);
        setHasDraft(true);
        dataRef.current = record.data;
        onRestore?.(record.data);
      }
    } catch {
      // abaikan data corrupt
    }
  }, [key]);

  // Auto-save tiap intervalMs
  useEffect(() => {
    const timer = setInterval(() => {
      if (dataRef.current) {
        saveDraft(dataRef.current);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [saveDraft, intervalMs]);

  // Simpan draft saat browser/tab ditutup (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dataRef.current) {
        saveDraft(dataRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  return { saveDraft, clearDraft, savedAt, hasDraft };
}
