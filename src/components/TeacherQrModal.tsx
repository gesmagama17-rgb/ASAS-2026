import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';
import type { OriginKind } from '../utils/shareUrl';

interface TeacherQrModalProps {
  title: string;
  subtitle: string;
  shareCode?: string;
  token?: string;
  shareUrl: string;
  originalUrl?: string;
  originKind: OriginKind;
  onClose: () => void;
}

export const TeacherQrModal: React.FC<TeacherQrModalProps> = ({
  title,
  subtitle,
  shareCode,
  token,
  shareUrl,
  originalUrl,
  originKind,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const safeName = (shareCode || 'portal-siswa').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    link.download = `qr-${safeName}.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-5 h-5 text-sky-700 shrink-0" />
            <h2 id="qr-modal-title" className="text-base font-bold text-slate-900 truncate">
              QR Code Akses Murid
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup QR Code"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-center">
          <div>
            <div className="text-sm font-bold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
          </div>

          {originKind === 'ai_studio_dev' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 text-left">
              Perhatian: Link ini masih memakai domain preview editor (<code className="font-mono">ais-dev-...</code>) yang meminta login Google AI Studio. Atur URL hasil Deploy terlebih dahulu sebelum membagikan QR ke murid.
            </div>
          )}

          <div className="flex justify-center">
            {qrDataUrl ? (
              <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block">
                <img
                  src={qrDataUrl}
                  alt={`QR Code untuk ${title}`}
                  className="w-56 h-56 block"
                />
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-500">
                Membuat QR Code...
              </div>
            )}
          </div>

          {(shareCode || token) && (
            <div className="flex items-center justify-center gap-4 text-xs text-slate-700 font-mono">
              {shareCode && (
                <span>
                  Kode: <strong>{shareCode}</strong>
                </span>
              )}
              {token && (
                <span>
                  Token: <strong>{token}</strong>
                </span>
              )}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 break-all font-semibold">
            {shareUrl}
          </div>

          {originalUrl && originalUrl !== shareUrl && (
            <div className="text-[11px] text-slate-500 font-mono break-all">
              Tujuan: {originalUrl}
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={!qrDataUrl}
              onClick={handleDownloadQr}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh QR (.png)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
