// src/pages/FormSortasi.tsx
import { useState } from 'react';
import { AlertBanner } from '../components/AlertBanner';

export function FormSortasi() {
  const [batchId, setBatchId] = useState('BATCH-2026-001');
  const [inputCurah, setInputCurah] = useState<number>(100);
  const [mutuA, setMutuA] = useState<number>(0);
  const [mutuB, setMutuB] = useState<number>(0);
  const [mutuC, setMutuC] = useState<number>(0);
  const [afkir, setAfkir] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Kalkulasi Real-Time Mass Balance
  const totalOutput = Number((mutuA + mutuB + mutuC + afkir).toFixed(2));
  const selisih = Number((inputCurah - totalOutput).toFixed(2));
  const isBalanced = inputCurah > 0 && selisih === 0;

  const handleSimpanSortasi = () => {
    if (!isBalanced) return;
    setSavedSuccess(true);
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>⚙️ Sortasi & Grading Mutu</h2>

      {/* Contoh Banner Peringatan Restock dari sistem */}
      <AlertBanner
        type="warning"
        title="Peringatan Restock (Reorder Point)"
        message="Stok karung kemasan 50 kg tersisa 12 lembar. Segera lakukan pengadaan ulang."
      />

      {savedSuccess && (
        <AlertBanner
          type="success"
          title="Hasil Sortasi Disimpan"
          message={`Data grading untuk ${batchId} berhasil dikunci dan masuk ke stok FIFO.`}
          onClose={() => setSavedSuccess(false)}
        />
      )}

      {/* Input Berat Awal */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Kode Batch</label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              style={cellInputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Berat Input Curah (kg)</label>
            <input
              type="number"
              step="0.01"
              value={inputCurah || ''}
              onChange={(e) => setInputCurah(parseFloat(e.target.value) || 0)}
              style={{ ...cellInputStyle, fontWeight: 'bold' }}
            />
          </div>
        </div>
      </div>

      {/* Tabel Input Grading Mutu */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderRadius: '8px 0 0 0' }}>Kategori Mutu</th>
            <th style={{ padding: '12px' }}>Keterangan</th>
            <th style={{ padding: '12px', width: '150px', borderRadius: '0 8px 0 0' }}>Berat (kg)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '12px', fontWeight: 'bold' }}>Mutu A (Premium)</td>
            <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>Kadar air &lt; 14%, bulir utuh</td>
            <td style={{ padding: '8px' }}>
              <input type="number" step="0.01" value={mutuA || ''} onChange={(e) => setMutuA(parseFloat(e.target.value) || 0)} style={cellInputStyle} />
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '12px', fontWeight: 'bold' }}>Mutu B (Medium)</td>
            <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>Standar pasar umum</td>
            <td style={{ padding: '8px' }}>
              <input type="number" step="0.01" value={mutuB || ''} onChange={(e) => setMutuB(parseFloat(e.target.value) || 0)} style={cellInputStyle} />
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '12px', fontWeight: 'bold' }}>Mutu C (Ekonomis)</td>
            <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>Bulir patah / ukuran kecil</td>
            <td style={{ padding: '8px' }}>
              <input type="number" step="0.01" value={mutuC || ''} onChange={(e) => setMutuC(parseFloat(e.target.value) || 0)} style={cellInputStyle} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: '12px', fontWeight: 'bold', color: '#dc2626' }}>Afkir (Reject)</td>
            <td style={{ padding: '12px', fontSize: '14px', color: '#475569' }}>Rusak / susut sortasi</td>
            <td style={{ padding: '8px' }}>
              <input type="number" step="0.01" value={afkir || ''} onChange={(e) => setAfkir(parseFloat(e.target.value) || 0)} style={cellInputStyle} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Indikator Real-Time Mass Balance */}
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          backgroundColor: isBalanced ? '#dcfce7' : '#fee2e2',
          border: `2px solid ${isBalanced ? '#22c55e' : '#ef4444'}`,
          color: isBalanced ? '#166534' : '#991b1b',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
          <span>Total Output: {totalOutput} kg / {inputCurah} kg</span>
          <span>
            {isBalanced
              ? '✅ Mass Balance Sesuai (0 kg selisih)'
              : selisih > 0
              ? `⚠️ Kurang ${selisih} kg lagi`
              : `❌ Kelebihan ${Math.abs(selisih)} kg`}
          </span>
        </div>
      </div>

      <button
        onClick={handleSimpanSortasi}
        disabled={!isBalanced}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: isBalanced ? '#16a34a' : '#94a3b8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isBalanced ? 'pointer' : 'not-allowed',
        }}
      >
        {isBalanced ? 'Simpan Hasil Sortasi' : 'Lengkapi Berat Hingga Sesuai untuk Menyimpan'}
      </button>
    </div>
  );
}

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
};