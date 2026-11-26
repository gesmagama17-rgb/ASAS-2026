import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCustomBackHalf,
  parseBitlyUserResponse,
  pickPreferredShareUrl,
  translateBitlyError,
  validateLongUrlForBitly,
} from './bitlyClient';

test('normalizeCustomBackHalf strips domain prefixes and unsafe characters', () => {
  assert.equal(normalizeCustomBackHalf('https://bit.ly/asas-ipas-5a'), 'asas-ipas-5a');
  assert.equal(normalizeCustomBackHalf('bit.ly/latihan kelas 5!'), 'latihan-kelas-5');
  assert.equal(normalizeCustomBackHalf('---uji_coba---'), 'uji_coba');
});

test('validateLongUrlForBitly accepts public HTTPS URLs and rejects localhost', () => {
  const valid = validateLongUrlForBitly('https://tka-sd.run.app/ujian/ASAS-IPAS-V');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.url, 'https://tka-sd.run.app/ujian/ASAS-IPAS-V');
  }

  const local = validateLongUrlForBitly('http://localhost:3000/ujian/ASAS-IPAS-V');
  assert.equal(local.ok, false);

  const empty = validateLongUrlForBitly('   ');
  assert.equal(empty.ok, false);
});

test('parseBitlyUserResponse extracts login, display name, and default_group_guid', () => {
  const parsed = parseBitlyUserResponse({
    login: 'guru_makale',
    name: 'Ibu Guru Kelas V',
    default_group_guid: 'Bg123456',
  });
  assert.equal(parsed.login, 'guru_makale');
  assert.equal(parsed.name, 'Ibu Guru Kelas V');
  assert.equal(parsed.defaultGroupGuid, 'Bg123456');
});

test('translateBitlyError translates common Bitly v4 errors to Indonesian', () => {
  assert.match(
    translateBitlyError(403, { message: 'FORBIDDEN' }),
    /Token atau izin akses Bit\.ly tidak valid/
  );
  assert.match(
    translateBitlyError(400, { message: 'INVALID_ARG_LONG_URL' }),
    /URL tujuan ditolak/
  );
  assert.match(
    translateBitlyError(429, { message: 'RATE_LIMIT_EXCEEDED' }),
    /Batas permintaan API Bit\.ly/
  );
});

test('pickPreferredShareUrl prefers Bitly short URL when available', () => {
  assert.equal(
    pickPreferredShareUrl('https://app.run.app/ujian/ASAS-IPAS-V', 'https://bit.ly/asas5'),
    'https://bit.ly/asas5'
  );
  assert.equal(
    pickPreferredShareUrl('https://app.run.app/ujian/ASAS-IPAS-V', ''),
    'https://app.run.app/ujian/ASAS-IPAS-V'
  );
});
