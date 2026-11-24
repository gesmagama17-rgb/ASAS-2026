import test from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import { parseWordHtmlToQuestions } from './wordQuestionParser';
import { buildSampleWordTemplateBuffer } from './wordTemplate';

test('parseWordHtmlToQuestions parses all 5 types, scores, weights, and bottom keys', () => {
  const html = `
    <p><strong>I. PILIHAN GANDA</strong></p>
    <p>1. Sumber energi panas terbesar di bumi adalah ....</p>
    <p>A. Bulan</p>
    <p>B. Matahari</p>
    <p>C. Api unggun</p>
    <p>D. Lampu</p>
    <p>Skor: 2</p>
    <p>Bobot: 2</p>
    <p>2. Alat musik yang dipetik adalah ....</p>
    <p>A. Gitar B. Drum C. Suling D. Gong</p>
    <p><strong>II. PILIHAN GANDA KOMPLEKS</strong></p>
    <p>3. Pilih dua benda yang dapat menghantarkan listrik!</p>
    <p>A. Tembaga</p>
    <p>B. Karet</p>
    <p>C. Besi</p>
    <p>D. Plastik</p>
    <p>Kunci: A, C</p>
    <p><strong>III. URAIAN</strong></p>
    <p>4. Jelaskan proses fotosintesis secara singkat!</p>
    <p>Rubrik: Skor 4 jika menyebut cahaya, air, CO2, dan hasil glukosa/oksigen.</p>
    <p><strong>KUNCI JAWABAN</strong></p>
    <p>1. B</p>
    <p>2. A</p>
    <p>4. Proses tumbuhan membuat makanan dengan bantuan cahaya matahari. [Skor: 5] [Bobot: 3]</p>
  `;

  const parsed = parseWordHtmlToQuestions({ html, defaultSubject: 'IPAS' });
  assert.equal(parsed.length, 4);

  assert.equal(parsed[0].type, 'pg');
  assert.equal(parsed[0].correctAnswer, 'B');
  assert.equal(parsed[0].maxScore, 2);
  assert.equal(parsed[0].weight, 2);
  assert.equal(parsed[0].options?.length, 4);

  assert.equal(parsed[1].type, 'pg');
  assert.equal(parsed[1].correctAnswer, 'A');
  assert.equal(parsed[1].options?.length, 4);
  assert.equal(parsed[1].options?.[2].text, 'Suling');

  assert.equal(parsed[2].type, 'pg_kompleks');
  assert.deepEqual(parsed[2].correctAnswer, ['A', 'C']);

  assert.equal(parsed[3].type, 'uraian');
  assert.equal(parsed[3].maxScore, 5);
  assert.equal(parsed[3].weight, 3);
  assert.match(String(parsed[3].rubric), /cahaya/);
});

test('parseWordHtmlToQuestions parses Word <ol> auto-numbered lists and generated .docx template', async () => {
  const buf = await buildSampleWordTemplateBuffer();
  const res = await mammoth.convertToHtml({ buffer: buf });
  const parsed = parseWordHtmlToQuestions({ html: res.value, defaultSubject: 'IPAS' });

  assert.equal(parsed.length, 5);
  assert.equal(parsed[0].type, 'pg');
  assert.equal(parsed[0].correctAnswer, 'B');
  assert.equal(parsed[1].type, 'pg_kompleks');
  assert.deepEqual(parsed[1].correctAnswer, ['A', 'C']);
  assert.equal(parsed[2].type, 'benar_salah');
  assert.equal(parsed[2].correctAnswer, 'BENAR');
  assert.equal(parsed[3].type, 'isian_singkat');
  assert.equal(parsed[3].correctAnswer, 'pengurai|dekomposer');
  assert.equal(parsed[4].type, 'uraian');
  assert.equal(parsed[4].maxScore, 4);
  assert.equal(parsed[4].weight, 2);
});
