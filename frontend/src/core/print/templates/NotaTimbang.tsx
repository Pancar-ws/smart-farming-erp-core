// src/core/print/templates/NotaTimbang.tsx
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { fmtDateTime } from '@/core/format/date';
import { fmtKg } from '@/core/format/money';

export interface NotaTimbangProps {
  data: {
    receipt_no: string;
    batch_code: string;
    at: string;
    member: { code: string; name: string };
    commodity: string;
    gross: string;
    tare: string;
    net: string;
    officer: string;
  };
}

export function NotaTimbang({ data }: NotaTimbangProps) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (data.batch_code) {
      QRCode.toDataURL(`BATCH:${data.batch_code}`, { margin: 0, width: 140 }).then(setQr);
    }
  }, [data.batch_code]);

  const orgName = typeof window !== 'undefined' && window.__CONFIG__?.orgName 
    ? window.__CONFIG__.orgName 
    : 'Koperasi Tani';

  return (
    <div className="print-area thermal font-mono text-center p-2 text-xs">
      <p className="font-bold text-sm tracking-wide">{orgName}</p>
      <p className="border-b border-black pb-1 mb-2">BUKTI TIMBANG PANEN</p>

      <div className="text-left space-y-1 mb-2">
        <div className="flex justify-between">
          <span>No. Bukti</span>
          <span className="font-semibold">{data.receipt_no}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal</span>
          <span>{fmtDateTime(data.at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Anggota</span>
          <span>{data.member.code} - {data.member.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Komoditas</span>
          <span>{data.commodity}</span>
        </div>
      </div>

      <div className="border-t border-b border-black py-1 my-2 text-left space-y-1">
        <div className="flex justify-between">
          <span>Berat Kotor</span>
          <span>{fmtKg(data.gross)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tara</span>
          <span>{fmtKg(data.tare)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1">
          <span>Berat Bersih</span>
          <span>{fmtKg(data.net)}</span>
        </div>
      </div>

      <div className="my-2">
        <p className="text-[10px] text-gray-700">Kode Batch Sistem:</p>
        <p className="font-bold text-xs tracking-wider">{data.batch_code}</p>
        {qr && <img src={qr} alt={`QR ${data.batch_code}`} className="mx-auto my-1" width={110} height={110} />}
      </div>

      <p className="text-[10px] text-gray-600 mt-2">Petugas: {data.officer}</p>
      <p className="text-[9px] text-gray-500 italic mt-1">Simpan struk ini sebagai bukti setoran sah.</p>
    </div>
  );
}

