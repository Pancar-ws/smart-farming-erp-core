// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/core/auth/session';
import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorPanel } from '@/components/feedback/ErrorPanel';
import { Eye, EyeOff, Lock, User as UserIcon, Sprout } from 'lucide-react';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    full_name: string;
    role: string;
    permissions: string[];
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orgName =
    typeof window !== 'undefined' && window.__CONFIG__?.orgName
      ? window.__CONFIG__.orgName
      : 'Koperasi Tani';

  const getRedirectPathForRole = (role: string): string => {
    switch (role) {
      case 'PETUGAS_PENERIMAAN':
        return '/timbang';
      case 'PETUGAS_SORTASI_QC':
        return '/sortasi';
      case 'ADMIN_GUDANG':
        return '/inventaris/saprotan';
      case 'BAGIAN_PENJUALAN':
        return '/penjualan';
      case 'BAGIAN_KEUANGAN':
        return '/keuangan/hutang-piutang';
      case 'ADMIN_KEANGGOTAAN':
        return '/anggota';
      case 'PENGURUS':
        return '/esg';
      case 'ANGGOTA_READONLY':
        return '/portal';
      case 'SUPERADMIN':
      default:
        return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { username, password },
      });

      setSession({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        user: {
          id: res.user.id,
          name: res.user.full_name || res.user.username,
          role: res.user.role,
          permissions: res.user.permissions || [],
        },
      });

      const returnTo = (location.state as any)?.returnTo;
      const targetPath = returnTo || getRedirectPathForRole(res.user.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMsg('Nama pengguna atau kata sandi salah.');
        } else if (err.status === 429) {
          setErrorMsg('Terlalu banyak percobaan. Coba lagi dalam beberapa menit.');
        } else {
          setErrorMsg(err.message || 'Gagal masuk ke dalam sistem.');
        }
      } else {
        setErrorMsg('Terjadi kesalahan jaringan atau server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-navy-700 flex items-center justify-center text-white shadow-lg">
            <Sprout className="w-8 h-8 text-green-50" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-ink-900">
          Masuk ke Sistem ERP
        </h2>
        <p className="mt-1 text-center text-sm text-ink-600 font-medium">
          {orgName}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 shadow-md rounded-panel border border-line sm:px-10">
          {errorMsg && (
            <div className="mb-6">
              <ErrorPanel message={errorMsg} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-ink-900 mb-1.5"
              >
                Nama pengguna
              </label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
                <UserIcon className="w-4 h-4 text-ink-600 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-ink-900 mb-1.5"
              >
                Kata sandi
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <Lock className="w-4 h-4 text-ink-600 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-ink-600 hover:text-ink-900 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full text-base font-semibold"
              >
                Masuk
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-center">
            <p className="text-xs text-ink-600">
              Lupa kata sandi? Hubungi Administrator Koperasi untuk pemulihan akun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

