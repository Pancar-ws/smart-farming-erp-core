// src/features/auth/pages/ForbiddenPage.tsx
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-coral-50 text-coral-700 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-ink-900">Akses Ditolak (403)</h1>
      <p className="mt-2 text-sm text-ink-600 max-w-md leading-relaxed">
        Peran pengguna Anda tidak memiliki izin untuk mengakses halaman atau fitur ini.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="md" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}

