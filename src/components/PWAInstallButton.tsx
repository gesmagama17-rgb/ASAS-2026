import React, { useState } from 'react';
import { Check, Copy, Download, ExternalLink, MonitorDown, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  installUrlOverride?: string;
  compact?: boolean;
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  installUrlOverride,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const rawTargetUrl =
    (installUrlOverride && installUrlOverride.trim()) ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const targetUrl = isSafeHttpUrl(rawTargetUrl)
    ? rawTargetUrl
    : typeof window !== 'undefined'
    ? window.location.origin
    : '';

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadDesktopLauncher = () => {
    if (!isSafeHttpUrl(targetUrl)) return;
    const safeUrlLiteral = JSON.stringify(targetUrl);
    const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Aplikasi ASAS SD — Buka Versi Desktop</title>
  <script>
    window.location.replace(${safeUrlLiteral});
  </script>
</head>
<body style="font-family:system-ui,sans-serif;padding:40px;text-align:center;color:#0f172a">
  <h1 style="font-size:20px;margin-bottom:8px">Membuka Aplikasi ASAS SD...</h1>
  <p style="font-size:14px;color:#475569;margin-bottom:16px">Jika tidak terbuka otomatis, klik tombol di bawah ini:</p>
  <a id="open-link" style="display:inline-block;padding:10px 18px;background:#0369a1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Buka Aplikasi</a>
  <script>
    var a = document.getElementById('open-link');
    a.href = ${safeUrlLiteral};
  </script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Aplikasi-ASAS-SD-Desktop.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          isInstallable
            ? 'border-sky-700 bg-sky-50 text-sky-800 hover:bg-sky-100'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        } ${compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'}`}
      >
        <MonitorDown className="w-3.5 h-3.5" />
        <span>{isInstallable ? 'Install Aplikasi Desktop' : 'Download Desktop'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MonitorDown className="w-5 h-5 text-sky-700 shrink-0" />
                <h2 id="pwa-guide-title" className="text-base font-bold text-slate-900">
                  Download &amp; Instal Versi Desktop
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan instalasi"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700">
              {isIOS ? (
                <div className="space-y-2 leading-relaxed">
                  <p className="font-semibold text-slate-900">Untuk iPad / iPhone (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah Safari.
                    </li>
                    <li>
                      Pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5 leading-relaxed">
                  {isInIframe && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      Browser tidak mengizinkan instalasi langsung dari dalam frame preview. Klik tombol <strong>Buka Tab Baru</strong> di bawah untuk langsung memunculkan tombol Install di Chrome/Edge.
                    </div>
                  )}
                  <p className="font-semibold text-slate-900 text-xs">
                    Cara Instal sebagai Aplikasi Komputer (Windows, Mac, Chromebook):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs">
                    <li>
                      Buka tautan aplikasi di tab utama <strong>Google Chrome</strong> atau{' '}
                      <strong>Microsoft Edge</strong>.
                    </li>
                    <li>
                      Klik tombol <strong>Install Aplikasi Desktop</strong> di atas atau ikon{' '}
                      <strong>Instal (layar + panah)</strong> di ujung kanan kolom alamat URL (atau menu{' '}
                      <strong>⋮ → Simpan dan bagikan / Aplikasi → Instal</strong>).
                    </li>
                    <li>
                      Aplikasi langsung terpasang di Desktop / Start Menu dengan ikon sendiri tanpa bilah browser.
                    </li>
                  </ol>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-800">Link Instalasi Desktop:</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 truncate">
                    {targetUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tab Baru</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadDesktopLauncher}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Pintasan (.html)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
