// src/pages/PenerimaanPanen.tsx
import { useState, useEffect } from 'react';
import { DraftBadge } from '../components/DraftBadge';
import { AlertBanner } from '../components/AlertBanner';

const STORAGE_KEY = 'erp_draft_penerimaan_panen';

export function PenerimaanPanen() {
  const [petani, setPetani] = useState('');
  const [komoditas, setKomoditas] = useState('Padi Ciherang');
  const [berat, setBerat] = useState<string>('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [notif, setNotif] = useState<{ type: 'error' | 'success'; title: string; msg: string } | null>(null);

  // 1. Muat draft otomatis dari Local Storage saat halaman dibuka
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      setPetani(parsed.petani || '');
      setKomoditas(parsed.komoditas || 'Padi Ciherang');
      setBerat(parsed.berat || '');
      if (parsed.savedAt) setSavedAt(new Date(parsed.savedAt));
    }
  }, []);

  // 2. Simpan draft otomatis setiap kali ada perubahan ketikan
  useEffect(() => {
    if (petani || berat) {
      const now = new Date();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ petani, komoditas, berat, savedAt: now.toISOString() })
      );
      setSavedAt(now);
    }
  }, [petani, komoditas, berat]);

  // 3. Simulasi tarik data dari timbangan digital (Web Serial API)
  const handleAmbilBerat = () => {
    const beratSimulasi = (Math.random() * (150 - 25) + 25).toFixed(2);
    setBerat(beratSimulasi);
    setNotif(null);
  };

  // 4. Simpan permanen & bersihkan draft
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petani.trim() || !berat || parseFloat(berat) <= 0) {
      setNotif({
        type: 'error',
        title: 'Data Belum Lengkap',
        msg: 'Nama petani dan berat timbangan wajib diisi dengan nilai lebih dari 0 kg.',
      });
      return;
    }

    setNotif({
      type: 'success',
      title: 'Setoran Panen Tersimpan',
      msg: `Berhasil mencatat ${berat} kg ${komoditas} dari ${petani}.`,
    });

    // Hapus draft setelah berhasil submit
    localStorage.removeItem(STORAGE_KEY);
    setPetani('');
    setBerat('');
    setSavedAt(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px' }}>📥 Penerimaan Panen (Gudang)</h2>
        <DraftBadge savedAt={savedAt} />
      </div>

      {notif && (
        <AlertBanner
          type={notif.type}
          title={notif.title}
          message={notif.msg}
          onClose={() => setNotif(null)}
        />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Nama Petani Anggota</label>
          <input
            type="text"
            placeholder="Ketik nama petani..."
            value={petani}
            onChange={(e) => setPetani(e.target.value)}
            style={inputTouchStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Jenis Komoditas</label>
          <select value={komoditas} onChange={(e) => setKomoditas(e.target.value)} style={inputTouchStyle}>
            <option value="Padi Ciherang">Padi Ciherang</option>
            <option value="Jagung Hibrida">Jagung Hibrida</option>
            <option value="Kedelai Lokal">Kedelai Lokal</option>
            <option value="Kopi Arabika">Kopi Arabika</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Berat Timbangan (kg)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={berat}
              onChange={(e) => setBerat(e.target.value)}
              style={{ ...inputTouchStyle, flex: 1, fontSize: '20px', fontWeight: 'bold' }}
            />
            <button
              type="button"
              onClick={handleAmbilBerat}
              style={{
                padding: '14px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              ⚖️ Ambil Berat
            </button>
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          Simpan Penerimaan Panen
        </button>
      </form>
    </div>
  );
}

const inputTouchStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: '16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};