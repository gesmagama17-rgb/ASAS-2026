import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  ShieldCheck,
  Unlink,
  X,
} from 'lucide-react';
import type { BitlyStatus } from '../types/exam';

interface TeacherBitlyModalProps {
  bitlyStatus: BitlyStatus | null;
  authHeaders: Record<string, string>;
  onStatusUpdated: (status: BitlyStatus) => void;
  onClose: () => void;
}

export const TeacherBitlyModal: React.FC<TeacherBitlyModalProps> = ({
  bitlyStatus,
  authHeaders,
  onStatusUpdated,
  onClose,
}) => {
  const [accessToken, setAccessToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [popupBlockedUrl, setPopupBlockedUrl] = useState('');
  const [showOAuthDetails, setShowOAuthDetails] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        origin !== window.location.origin
      ) {
        return;
      }
      if (event.data?.type === 'BITLY_OAUTH_SUCCESS') {
        setOauthLoading(false);
        setPopupBlockedUrl('');
        setErrorMsg('');
        void (async () => {
          try {
            const res = await fetch('/api/teacher/bitly/status', { headers: authHeaders });
            const data = await res.json();
            if (res.ok && data.status) {
              onStatusUpdated(data.status);
              setSuccessMsg('Akun Bit.ly berhasil terhubung melalui OAuth.');
            }
          } catch {
            // Ignore transient refresh failure
          }
        })();
      } else if (event.data?.type === 'BITLY_OAUTH_ERROR') {
        setOauthLoading(false);
        setErrorMsg(event.data.error || 'Otorisasi Bit.ly gagal atau dibatalkan.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authHeaders, onStatusUpdated]);

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!accessToken.trim() && !bitlyStatus?.envTokenActive) {
      setErrorMsg('Tempelkan Generic Access Token dari akun Bit.ly Anda terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/teacher/bitly/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ accessToken: accessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menghubungkan akun Bit.ly.');
        return;
      }
      if (data.status) {
        onStatusUpdated(data.status);
      }
      setAccessToken('');
      setSuccessMsg(`Akun Bit.ly (@${data.status?.login || 'aktif'}) berhasil dihubungkan.`);
    } catch {
      setErrorMsg('Gagal menghubungi server untuk memverifikasi token Bit.ly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectOAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setPopupBlockedUrl('');
    setOauthLoading(true);
    try {
      const res = await fetch('/api/teacher/bitly/oauth/url', {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setOauthLoading(false);
        setErrorMsg(data.error || 'OAuth Bit.ly belum dikonfigurasi di server.');
        return;
      }

      const authWin = window.open(
        data.url,
        'bitly_oauth_popup',
        'width=600,height=700,resizable=yes,scrollbars=yes'
      );
      if (!authWin) {
        setOauthLoading(false);
        setPopupBlockedUrl(data.url);
        setErrorMsg(
          'Browser menahan jendela popup Bit.ly. Gunakan tombol "Buka Otorisasi Bit.ly" di bawah.'
        );
      }
    } catch {
      setOauthLoading(false);
      setErrorMsg('Gagal memulai otorisasi OAuth Bit.ly.');
    }
  };

  const handleDisconnect = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setDisconnecting(true);
    try {
      const res = await fetch('/api/teacher/bitly/disconnect', {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok && data.status) {
        onStatusUpdated(data.status);
        setSuccessMsg('Koneksi akun Bit.ly telah diputuskan.');
      }
    } catch {
      setErrorMsg('Gagal memutuskan koneksi Bit.ly.');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = Boolean(bitlyStatus?.connected);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bitly-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 sticky top-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="bitly-modal-title" className="text-base font-bold text-slate-900 truncate">
                Hubungkan Akun Bit.ly
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Perpendek link ujian murid menjadi bit.ly agar mudah dibagikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan Bit.ly"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {errorMsg && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isConnected && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      Akun Bit.ly Terhubung
                    </div>
                    <div className="text-xs text-slate-700 mt-0.5">
                      Akun: <strong>@{bitlyStatus?.login || 'bitly-user'}</strong>
                      {bitlyStatus?.name && bitlyStatus.name !== bitlyStatus.login
                        ? ` (${bitlyStatus.name})`
                        : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Domain pendek: <code className="font-mono font-semibold">{bitlyStatus?.domain || 'bit.ly'}</code>
                      {' · '}
                      Metode:{' '}
                      {bitlyStatus?.authMethod === 'oauth'
                        ? 'OAuth Bit.ly'
                        : bitlyStatus?.authMethod === 'env'
                        ? 'Secret Server'
                        : 'Access Token'}
                    </div>
                  </div>
                </div>
                {bitlyStatus?.authMethod !== 'env' && (
                  <button
                    type="button"
                    disabled={disconnecting}
                    onClick={() => void handleDisconnect()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-700 rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>{disconnecting ? 'Memutuskan...' : 'Putuskan'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-emerald-900">
                Sekarang Anda bisa langsung menekan tombol <strong>Perpendek via Bit.ly</strong> pada setiap paket ujian di halaman Paket Ujian &amp; Link.
              </p>
            </div>
          )}

          {/* Method 1: Instant Generic Access Token */}
          <form onSubmit={(e) => void handleConnectToken(e)} className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <KeyRound className="w-4 h-4 text-sky-700" />
                <span>{isConnected ? 'Ganti / Perbarui Access Token Bit.ly' : 'Cara Cepat: Pakai Access Token Bit.ly'}</span>
              </div>
              <a
                href="https://app.bitly.com/settings/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <span>Buka API Bit.ly</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
              <li>
                Login ke akun Bit.ly Anda lalu klik <strong>Buka API Bit.ly</strong> di kanan atas.
              </li>
              <li>
                Masukkan kata sandi Bit.ly jika diminta, lalu klik tombol <strong>Generate Token</strong>.
              </li>
              <li>
                Salin token yang muncul, tempel di bawah ini, lalu klik <strong>Simpan &amp; Hubungkan</strong>.
              </li>
            </ol>

            <div>
              <label htmlFor="bitly-access-token" className="block text-xs font-semibold text-slate-700 mb-1">
                Generic Access Token Bit.ly
              </label>
              <input
                id="bitly-access-token"
                type="password"
                autoComplete="off"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={
                  isConnected
                    ? 'Tempel token baru jika ingin mengganti akun Bit.ly'
                    : 'Tempel token dari app.bitly.com/settings/api'
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Token disimpan aman di server sekolah dan tidak pernah dikirim ke halaman siswa.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun Bit.ly...</span>
                </>
              ) : (
                <span>{isConnected ? 'Perbarui Koneksi Bit.ly' : 'Simpan & Hubungkan Bit.ly'}</span>
              )}
            </button>
          </form>

          {/* Method 2: Bitly OAuth (for OAuth App credentials) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            {bitlyStatus?.oauthConfigured ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-700">
                  Atau Hubungkan Otomatis via OAuth Bit.ly
                </div>
                <button
                  type="button"
                  disabled={oauthLoading}
                  onClick={() => void handleConnectOAuth()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {oauthLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menunggu Otorisasi Bit.ly...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Login dengan OAuth Bit.ly</span>
                    </>
                  )}
                </button>
                {popupBlockedUrl && (
                  <a
                    href={popupBlockedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Buka Otorisasi Bit.ly di Tab Baru
                  </a>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowOAuthDetails((v) => !v)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  {showOAuthDetails
                    ? 'Sembunyikan info integrasi OAuth App Bit.ly'
                    : 'Ingin pakai OAuth App Bit.ly (Client ID & Secret)? Lihat info setup'}
                </button>
                {showOAuthDetails && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1.5">
                    <p>
                      Jika Anda memiliki OAuth App di Bit.ly, tambahkan <code className="font-mono text-slate-800">BITLY_CLIENT_ID</code> dan <code className="font-mono text-slate-800">BITLY_CLIENT_SECRET</code> di panel Secrets, lalu daftarkan Redirect URI berikut di Bit.ly:
                    </p>
                    <code className="block p-2 bg-white border border-slate-200 rounded font-mono text-slate-800 break-all">
                      {bitlyStatus?.callbackUrl || `${window.location.origin}/api/bitly/callback`}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
