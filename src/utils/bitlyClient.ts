export interface ParsedBitlyUser {
  login: string;
  name: string;
  defaultGroupGuid?: string;
}

export function normalizeCustomBackHalf(rawInput: string): string {
  const cleaned = rawInput
    .trim()
    .replace(/^https?:\/\/(bit\.ly|j\.mp|bitly\.com)\//i, '')
    .replace(/^bit\.ly\//i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 60);
}

export function validateLongUrlForBitly(
  rawUrl: string
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: 'URL tujuan yang akan diperpendek tidak boleh kosong.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Format URL tujuan tidak valid.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'URL harus diawali http:// atau https://.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return {
      ok: false,
      error:
        'Bit.ly tidak dapat memperpendek alamat localhost. Buka aplikasi dari URL Cloud Run / Deploy atau atur URL Publik terlebih dahulu.',
    };
  }

  return { ok: true, url: parsed.toString() };
}

export function parseBitlyUserResponse(data: unknown): ParsedBitlyUser {
  const obj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const login = typeof obj.login === 'string' ? obj.login.trim() : '';
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : login;
  const defaultGroupGuid =
    typeof obj.default_group_guid === 'string' && obj.default_group_guid.trim()
      ? obj.default_group_guid.trim()
      : undefined;

  if (!login) {
    throw new Error('Respons akun Bit.ly tidak valid.');
  }

  return { login, name, defaultGroupGuid };
}

export function translateBitlyError(status: number, data: unknown): string {
  const obj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const message = typeof obj.message === 'string' ? obj.message : '';
  const description = typeof obj.description === 'string' ? obj.description : '';
  const combined = `${message} ${description}`.toUpperCase();

  if (status === 401 || status === 403 || combined.includes('FORBIDDEN')) {
    return 'Token atau izin akses Bit.ly tidak valid atau sudah dicabut. Silakan periksa kembali token akun Bit.ly Anda.';
  }
  if (combined.includes('INVALID_ARG_LONG_URL')) {
    return 'URL tujuan ditolak oleh Bit.ly. Pastikan URL publik aktif dan bukan alamat lokal.';
  }
  if (combined.includes('ALREADY_A_BITLY_LINK')) {
    return 'Alamat tersebut sudah merupakan tautan Bit.ly.';
  }
  if (combined.includes('CUSTOM_LINK_TAKEN') || combined.includes('KEYWORD_ALREADY_EXISTS')) {
    return 'Nama link khusus (back-half) tersebut sudah dipakai orang lain di Bit.ly. Gunakan nama lain atau kosongkan agar dibuat otomatis.';
  }
  if (status === 429 || combined.includes('RATE_LIMIT')) {
    return 'Batas permintaan API Bit.ly tercapai sementara. Silakan tunggu beberapa saat lalu coba lagi.';
  }
  if (status === 402 || combined.includes('UPGRADE') || combined.includes('MONTHLY_LIMIT')) {
    return 'Batas paket gratis Bit.ly Anda telah tercapai untuk fitur atau bulan ini.';
  }
  if (description) {
    return `Gagal menghubungi Bit.ly: ${description}`;
  }
  if (message) {
    return `Gagal menghubungi Bit.ly: ${message}`;
  }
  return `Bit.ly mengembalikan kesalahan (HTTP ${status}).`;
}

export function pickPreferredShareUrl(fullUrl: string, bitlyShortUrl?: string | null): string {
  const cleanShort = (bitlyShortUrl || '').trim();
  if (cleanShort) return cleanShort;
  return fullUrl;
}
