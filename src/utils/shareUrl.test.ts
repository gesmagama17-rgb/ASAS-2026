import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudentCatalogUrl,
  buildStudentExamUrl,
  buildWhatsAppShareMessage,
  classifyOrigin,
  normalizePublicBaseUrl,
  resolveStudentShareBaseUrl,
} from './shareUrl';

test('classifyOrigin identifies AI Studio dev preview, shared preview, localhost, and public Cloud Run URLs', () => {
  assert.equal(
    classifyOrigin('https://ais-dev-abc123.asia-southeast1.run.app'),
    'ai_studio_dev'
  );
  assert.equal(
    classifyOrigin('https://ais-pre-abc123.asia-southeast1.run.app'),
    'ai_studio_shared'
  );
  assert.equal(classifyOrigin('http://localhost:3000'), 'localhost');
  assert.equal(
    classifyOrigin('https://tka-asas-sd-809866847338.asia-southeast1.run.app'),
    'public'
  );
});

test('normalizePublicBaseUrl strips accidental paths/queries and rejects unsafe schemes', () => {
  assert.deepEqual(
    normalizePublicBaseUrl('https://ujian-sdn2.asia-southeast1.run.app/guru?foo=1'),
    { ok: true, origin: 'https://ujian-sdn2.asia-southeast1.run.app' }
  );
  assert.deepEqual(normalizePublicBaseUrl('ujian-sdn2.run.app/'), {
    ok: true,
    origin: 'https://ujian-sdn2.run.app',
  });
  assert.deepEqual(normalizePublicBaseUrl(''), { ok: true, origin: '' });
  assert.equal(normalizePublicBaseUrl('javascript:alert(1)').ok, false);
});

test('resolveStudentShareBaseUrl prefers configured public URL over ais-dev preview origin', () => {
  const res = resolveStudentShareBaseUrl({
    configuredPublicUrl: 'https://tka-sdn2.asia-southeast1.run.app/ujian/ASAS-IPAS-V',
    currentOrigin: 'https://ais-dev-abc123.asia-southeast1.run.app',
  });
  assert.equal(res.baseUrl, 'https://tka-sdn2.asia-southeast1.run.app');
  assert.equal(res.originKind, 'public');
  assert.equal(res.usesCustomPublicUrl, true);

  const fallback = resolveStudentShareBaseUrl({
    configuredPublicUrl: '',
    currentOrigin: 'https://ais-dev-abc123.asia-southeast1.run.app',
  });
  assert.equal(fallback.originKind, 'ai_studio_dev');
  assert.equal(fallback.usesCustomPublicUrl, false);
});

test('buildStudentExamUrl, buildStudentCatalogUrl, and WhatsApp message generate clean student links', () => {
  const url = buildStudentExamUrl('https://tka-sdn2.run.app/', 'ASAS-IPAS-V');
  assert.equal(url, 'https://tka-sdn2.run.app/ujian/ASAS-IPAS-V');
  assert.equal(
    buildStudentCatalogUrl('https://tka-sdn2.run.app/'),
    'https://tka-sdn2.run.app/mulai'
  );

  const msg = buildWhatsAppShareMessage(
    {
      title: 'ASAS IPAS Kelas V',
      subject: 'IPAS',
      questionCount: 30,
      durationMinutes: 60,
      token: 'IPAS26',
    },
    url
  );
  assert.match(msg, /https:\/\/tka-sdn2\.run\.app\/ujian\/ASAS-IPAS-V/);
  assert.match(msg, /Token Ujian: \*IPAS26\*/);
});
