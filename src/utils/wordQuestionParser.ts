import type {
  ParsedWordQuestion,
  QuestionOption,
  QuestionType,
  TableData,
} from '../types/exam';

interface HtmlBlock {
  kind: 'paragraph' | 'list-item' | 'table';
  text: string;
  markedHtml?: string;
  listLevel?: number;
  listOrdered?: boolean;
  table?: TableData;
}

interface BottomKeyEntry {
  answer: string;
  maxScore?: number;
  weight?: number;
  rubric?: string;
}

const MARK_START = '[[MARK]]';
const MARK_END = '[[/MARK]]';

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripTagsPreserveMarks(html: string): string {
  let out = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b|u)\b[^>]*>([\s\S]*?)<\/\1>/gi, `${MARK_START}$2${MARK_END}`)
    .replace(/<[^>]+>/g, '');
  out = decodeHtmlEntities(out);
  return out.replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
}

function cleanMarks(text: string): string {
  return text.replace(/\[\[\/?MARK\]\]/g, '').replace(/[ \t]+/g, ' ').trim();
}

function parseTableHtml(tableHtml: string): TableData | undefined {
  const rowMatches = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
  if (rowMatches.length === 0) return undefined;

  const parsedRows: string[][] = [];
  for (const rowMatch of rowMatches) {
    const cellMatches = Array.from(
      rowMatch[1].matchAll(/<(t[hd])\b[^>]*>([\s\S]*?)<\/\1>/gi)
    );
    const cells = cellMatches.map((m) => cleanMarks(stripTagsPreserveMarks(m[2])));
    if (cells.length > 0 && cells.some((c) => c.length > 0)) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length < 2) return undefined;
  const colCount = Math.max(...parsedRows.map((r) => r.length));
  const normalizeRow = (r: string[]) =>
    Array.from({ length: colCount }, (_, idx) => r[idx] ?? '');

  return {
    headers: normalizeRow(parsedRows[0]),
    rows: parsedRows.slice(1).map(normalizeRow),
  };
}

function extractBlocksFromHtml(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  // Replace tables first with placeholders so nested <p> inside <td> aren't double-parsed
  const tables: TableData[] = [];
  const withoutTables = html.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (full) => {
    const parsed = parseTableHtml(full);
    if (!parsed) return '\n';
    const idx = tables.push(parsed) - 1;
    return `<p>[[TABLE_${idx}]]</p>`;
  });

  // Tokenize open/close <ol>/<ul>, <li>, <p>, <h1..h6>
  const tokenRegex = /<(\/?)(ol|ul|li|p|h[1-6])\b[^>]*>/gi;
  let listStack: boolean[] = []; // true = ordered, false = unordered
  let lastIndex = 0;
  let currentTag: 'li' | 'p' | 'h' | null = null;
  let buffer = '';
  let currentListOrdered = false;
  let currentListLevel = 0;

  const flushBuffer = () => {
    if (!currentTag) return;
    const trimmed = buffer.trim();
    if (!trimmed) {
      buffer = '';
      currentTag = null;
      return;
    }

    const tableMatch = trimmed.match(/^\[\[TABLE_(\d+)\]\]$/);
    if (tableMatch) {
      const t = tables[Number(tableMatch[1])];
      if (t) {
        blocks.push({ kind: 'table', text: '', table: t });
      }
      buffer = '';
      currentTag = null;
      return;
    }

    const textWithMarks = stripTagsPreserveMarks(trimmed);
    const lines = textWithMarks
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const tableInline = line.match(/^\[\[TABLE_(\d+)\]\]$/);
      if (tableInline) {
        const t = tables[Number(tableInline[1])];
        if (t) blocks.push({ kind: 'table', text: '', table: t });
        continue;
      }
      if (currentTag === 'li') {
        blocks.push({
          kind: 'list-item',
          text: cleanMarks(line),
          markedHtml: line,
          listLevel: Math.max(1, currentListLevel),
          listOrdered: currentListOrdered,
        });
      } else {
        blocks.push({
          kind: 'paragraph',
          text: cleanMarks(line),
          markedHtml: line,
        });
      }
    }

    buffer = '';
    currentTag = null;
  };

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(withoutTables)) !== null) {
    const isClose = match[1] === '/';
    const tag = match[2].toLowerCase();
    const chunk = withoutTables.slice(lastIndex, match.index);
    if (currentTag) {
      buffer += chunk;
    }
    lastIndex = tokenRegex.lastIndex;

    if (tag === 'ol' || tag === 'ul') {
      if (!isClose) {
        if (currentTag === 'li' && buffer.trim()) {
          // Flush parent <li> text before nested list starts
          flushBuffer();
        }
        listStack.push(tag === 'ol');
      } else {
        if (currentTag) flushBuffer();
        listStack.pop();
      }
    } else if (tag === 'li') {
      if (!isClose) {
        if (currentTag) flushBuffer();
        currentTag = 'li';
        currentListLevel = listStack.length;
        currentListOrdered = listStack[listStack.length - 1] ?? true;
        buffer = '';
      } else {
        flushBuffer();
      }
    } else if (tag === 'p' || tag.startsWith('h')) {
      if (!isClose) {
        if (!currentTag) {
          currentTag = tag === 'p' ? 'p' : 'h';
          buffer = '';
        }
      } else if (currentTag === 'p' || currentTag === 'h') {
        flushBuffer();
      } else if (currentTag === 'li') {
        buffer += '\n';
      }
    }
  }

  if (lastIndex < withoutTables.length && currentTag) {
    buffer += withoutTables.slice(lastIndex);
    flushBuffer();
  }

  return blocks;
}

function splitInlineOptions(line: string): Array<{ id: string; text: string }> | null {
  // Detects e.g. "A. Merkurius   B. Venus   C. Bumi   D. Mars" or "a. ... b. ... c. ... d. ..."
  const matches = Array.from(
    line.matchAll(/(?:^|\s{1,}|\t)([A-Ea-e])\s*[.)]\s+/g)
  );
  if (matches.length < 2) return null;
  // Must start near beginning with A or a
  const firstLetter = matches[0][1].toUpperCase();
  if (firstLetter !== 'A') return null;

  const opts: Array<{ id: string; text: string }> = [];
  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length;
    const optText = line.slice(start, end).trim();
    opts.push({ id: m[1].toUpperCase(), text: optText });
  }
  return opts;
}

function detectSectionTypeHint(line: string): QuestionType | null {
  const normalized = line.trim();
  if (!normalized || normalized.length > 90) return null;
  if (/pilihan\s+ganda\s+kompleks/i.test(normalized)) return 'pg_kompleks';
  if (/^(?:bagian\s+)?(?:[ivx]+|[a-d])?\s*[.)]?\s*pilihan\s+ganda\b/i.test(normalized) || /^pilihan\s+ganda$/i.test(normalized)) {
    return 'pg';
  }
  if (/benar\s*[\/\-atau&\s]+\s*salah/i.test(normalized)) return 'benar_salah';
  if (/^(?:bagian\s+)?(?:[ivx]+|[a-d])?\s*[.)]?\s*isian(?:\s+singkat)?\b/i.test(normalized) || /^isian\s+singkat$/i.test(normalized)) {
    return 'isian_singkat';
  }
  if (/^(?:bagian\s+)?(?:[ivx]+|[a-d])?\s*[.)]?\s*(?:uraian|esai|essay|jawablah\s+pertanyaan)\b/i.test(normalized)) {
    return 'uraian';
  }
  return null;
}

function detectQuestionTypeValue(raw: string): QuestionType | null {
  const v = raw.trim().toLowerCase();
  if (v.includes('kompleks')) return 'pg_kompleks';
  if (v === 'pg' || v.includes('pilihan ganda')) return 'pg';
  if (v.includes('benar') && v.includes('salah')) return 'benar_salah';
  if (v.includes('isian')) return 'isian_singkat';
  if (v.includes('uraian') || v.includes('esai') || v.includes('essay')) return 'uraian';
  return null;
}

function parseBottomKeySection(blocks: HtmlBlock[]): Map<number, BottomKeyEntry> {
  const keyMap = new Map<number, BottomKeyEntry>();

  for (const block of blocks) {
    if (block.kind === 'table' && block.table) {
      const headersLower = block.table.headers.map((h) => h.toLowerCase());
      const noCol = headersLower.findIndex((h) => /\bno\b|nomor/.test(h));
      const keyCol = headersLower.findIndex((h) => /kunci|jawaban/.test(h));
      const scoreCol = headersLower.findIndex((h) => /skor|nilai/.test(h));
      const weightCol = headersLower.findIndex((h) => /bobot/.test(h));
      const rubricCol = headersLower.findIndex((h) => /rubrik|pedoman/.test(h));

      for (const row of block.table.rows) {
        const numRaw = noCol >= 0 ? row[noCol] : row[0];
        const qNum = parseInt((numRaw || '').replace(/\D+/g, ''), 10);
        if (!Number.isFinite(qNum) || qNum <= 0) continue;
        const ans = keyCol >= 0 ? row[keyCol] : row[1] || '';
        const scoreVal = scoreCol >= 0 ? parseFloat(row[scoreCol]) : NaN;
        const weightVal = weightCol >= 0 ? parseFloat(row[weightCol]) : NaN;
        const rubricVal = rubricCol >= 0 ? row[rubricCol] : undefined;
        if (ans.trim()) {
          keyMap.set(qNum, {
            answer: ans.trim(),
            maxScore: Number.isFinite(scoreVal) && scoreVal > 0 ? scoreVal : undefined,
            weight: Number.isFinite(weightVal) && weightVal > 0 ? weightVal : undefined,
            rubric: rubricVal?.trim() || undefined,
          });
        }
      }
      continue;
    }

    const line = block.text.trim();
    if (!line) continue;

    // Match multiple pairs on a line: "1. A  2. B  3. C" or single "1. A (Skor 4, Bobot 2)"
    const multiMatches = Array.from(
      line.matchAll(/(\d{1,3})\s*[.)]\s*([^0-9\n][^\n]*?)(?=\s+\d{1,3}\s*[.)]|$)/g)
    );
    if (multiMatches.length > 1) {
      for (const m of multiMatches) {
        const qNum = parseInt(m[1], 10);
        const ans = m[2].trim();
        if (Number.isFinite(qNum) && ans) {
          keyMap.set(qNum, { answer: ans });
        }
      }
      continue;
    }

    const singleMatch = line.match(/^(\d{1,3})\s*[.)]\s*(.+)$/);
    if (singleMatch) {
      const qNum = parseInt(singleMatch[1], 10);
      let rest = singleMatch[2].trim();
      let maxScore: number | undefined;
      let weight: number | undefined;

      const scoreMatch = rest.match(/[\[(]\s*skor\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*[\])]/i);
      if (scoreMatch) {
        maxScore = parseFloat(scoreMatch[1].replace(',', '.'));
        rest = rest.replace(scoreMatch[0], '').trim();
      }
      const weightMatch = rest.match(/[\[(]\s*bobot\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*[\])]/i);
      if (weightMatch) {
        weight = parseFloat(weightMatch[1].replace(',', '.'));
        rest = rest.replace(weightMatch[0], '').trim();
      }

      if (Number.isFinite(qNum) && rest) {
        keyMap.set(qNum, { answer: rest, maxScore, weight });
      }
    }
  }

  return keyMap;
}

interface DraftQuestion {
  number: number;
  sectionHint: QuestionType | null;
  explicitType: QuestionType | null;
  promptLines: string[];
  passage?: string;
  tableData?: TableData;
  options: Array<QuestionOption & { isMarked?: boolean }>;
  rawKey?: string;
  rubric?: string;
  maxScore?: number;
  weight?: number;
}

function finalizeDraftQuestion(
  draft: DraftQuestion,
  index: number,
  bottomKey: BottomKeyEntry | undefined,
  defaultSubject: string
): ParsedWordQuestion {
  let prompt = draft.promptLines.join('\n').trim();
  let maxScore = draft.maxScore ?? bottomKey?.maxScore;
  let weight = draft.weight ?? bottomKey?.weight ?? 1;
  let rubric = draft.rubric ?? bottomKey?.rubric;

  // Check inline trailing (Skor: 4) or (Bobot: 2) in prompt
  const inlineScore = prompt.match(/[\[(]\s*skor\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*[\])]/i);
  if (inlineScore) {
    if (!maxScore) maxScore = parseFloat(inlineScore[1].replace(',', '.'));
    prompt = prompt.replace(inlineScore[0], '').trim();
  }
  const inlineWeight = prompt.match(/[\[(]\s*bobot\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*[\])]/i);
  if (inlineWeight) {
    weight = parseFloat(inlineWeight[1].replace(',', '.'));
    prompt = prompt.replace(inlineWeight[0], '').trim();
  }

  const rawKey = (draft.rawKey ?? bottomKey?.answer ?? '').trim();

  // Determine QuestionType
  let qType: QuestionType = 'pg';
  if (draft.explicitType) {
    qType = draft.explicitType;
  } else if (draft.options.length > 0) {
    const optTexts = draft.options.map((o) => o.text.trim().toLowerCase());
    if (
      draft.options.length === 2 &&
      optTexts.includes('benar') &&
      optTexts.includes('salah')
    ) {
      qType = 'benar_salah';
    } else if (
      draft.sectionHint === 'pg_kompleks' ||
      /pilih(?:lah)?\s+lebih\s+dari\s+satu|jawaban\s+benar\s+lebih\s+dari/i.test(prompt) ||
      /^[A-E](?:\s*[,&/]\s*|\s+dan\s+)[A-E]/i.test(rawKey)
    ) {
      qType = 'pg_kompleks';
    } else {
      qType = 'pg';
    }
  } else if (/^(benar|salah)$/i.test(rawKey) || draft.sectionHint === 'benar_salah') {
    qType = 'benar_salah';
  } else if (draft.sectionHint === 'isian_singkat') {
    qType = 'isian_singkat';
  } else if (draft.sectionHint === 'uraian') {
    qType = 'uraian';
  } else if (rawKey && rawKey.length <= 28 && !rawKey.includes(' ') && /_{3,}|\.\.\./.test(prompt)) {
    qType = 'isian_singkat';
  } else {
    qType = 'uraian';
  }

  // Normalize options & correctAnswer
  let options: QuestionOption[] | undefined;
  let correctAnswer: string | string[] = '';
  let warning: string | undefined;

  if (qType === 'pg' || qType === 'pg_kompleks') {
    options = draft.options.map((o) => ({ id: o.id, text: o.text }));
    if (options.length === 0) {
      options = [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ];
      warning = 'Pilihan jawaban A-D belum terdeteksi — lengkapi sebelum menyimpan.';
    }

    if (qType === 'pg') {
      const letterMatch = rawKey.toUpperCase().match(/\b([A-E])\b/);
      if (letterMatch) {
        correctAnswer = letterMatch[1];
      } else {
        const markedOpts = draft.options.filter((o) => o.isMarked);
        if (markedOpts.length === 1) {
          correctAnswer = markedOpts[0].id;
        } else {
          correctAnswer = options[0]?.id || 'A';
          if (!warning) {
            warning = 'Kunci jawaban belum terdeteksi (diisi sementara A) — silakan periksa.';
          }
        }
      }
    } else {
      const letters = Array.from(rawKey.toUpperCase().matchAll(/\b([A-E])\b/g)).map((m) => m[1]);
      if (letters.length > 0) {
        correctAnswer = Array.from(new Set(letters));
      } else {
        const markedOpts = draft.options.filter((o) => o.isMarked).map((o) => o.id);
        if (markedOpts.length > 0) {
          correctAnswer = markedOpts;
        } else {
          correctAnswer = ['A'];
          if (!warning) {
            warning = 'Kunci jawaban PG Kompleks belum terdeteksi — silakan pilih kunci.';
          }
        }
      }
    }
  } else if (qType === 'benar_salah') {
    options = [
      { id: 'BENAR', text: 'Benar' },
      { id: 'SALAH', text: 'Salah' },
    ];
    if (/salah|\bs\b/i.test(rawKey) && !/benar/i.test(rawKey)) {
      correctAnswer = 'SALAH';
    } else if (/benar|\bb\b/i.test(rawKey)) {
      correctAnswer = 'BENAR';
    } else {
      correctAnswer = 'BENAR';
      warning = 'Kunci Benar/Salah belum terdeteksi (diisi sementara Benar).';
    }
  } else if (qType === 'isian_singkat') {
    correctAnswer = rawKey || '';
    if (!correctAnswer) {
      warning = 'Kunci jawaban isian singkat belum terdeteksi — silakan isi kunci.';
    }
  } else {
    // uraian
    correctAnswer = rawKey || 'Sesuai pedoman penilaian guru.';
  }

  const finalMaxScore =
    typeof maxScore === 'number' && Number.isFinite(maxScore) && maxScore > 0
      ? maxScore
      : qType === 'uraian'
        ? 4
        : 1;

  const finalWeight =
    typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? weight : 1;

  return {
    tempId: `word-${index + 1}-${draft.number}`,
    subject: defaultSubject,
    type: qType,
    prompt,
    passage: draft.passage,
    tableData: draft.tableData,
    options,
    correctAnswer,
    rubric,
    maxScore: finalMaxScore,
    weight: finalWeight,
    warning,
  };
}

export function parseWordHtmlToQuestions(params: {
  html: string;
  rawText?: string;
  defaultSubject?: string;
}): ParsedWordQuestion[] {
  const { html, rawText = '', defaultSubject = 'IPAS' } = params;

  let blocks = extractBlocksFromHtml(html);
  if (blocks.length === 0 && rawText.trim()) {
    blocks = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ kind: 'paragraph' as const, text: l, markedHtml: l }));
  }

  // Split blocks at bottom KUNCI JAWABAN section if present
  const keySectionIndex = blocks.findIndex(
    (b) =>
      b.kind === 'paragraph' &&
      /^(?:[A-Z]\.\s*)?(?:KUNCI\s+JAWABAN|KUNCI\s+SOAL|PEDOMAN\s+PENSKORAN)\b/i.test(
        b.text.trim()
      )
  );

  const mainBlocks = keySectionIndex >= 0 ? blocks.slice(0, keySectionIndex) : blocks;
  const keyBlocks = keySectionIndex >= 0 ? blocks.slice(keySectionIndex + 1) : [];
  const bottomKeyMap = parseBottomKeySection(keyBlocks);

  const drafts: DraftQuestion[] = [];
  let current: DraftQuestion | null = null;
  let activeSectionHint: QuestionType | null = null;
  let pendingPassage = '';
  let autoQuestionCounter = 0;

  const pushCurrent = () => {
    if (current && current.promptLines.join('').trim()) {
      drafts.push(current);
    }
    current = null;
  };

  for (let i = 0; i < mainBlocks.length; i += 1) {
    const block = mainBlocks[i];

    if (block.kind === 'table' && block.table) {
      if (current) {
        current.tableData = block.table;
      }
      continue;
    }

    const line = block.text.trim();
    if (!line) continue;

    // Skip generic exam header noise before first question
    if (!current && drafts.length === 0) {
      if (
        /^(?:PEMERINTAH|DINAS\s+PENDIDIKAN|UPT\s+SDN|ASESMEN\s+SUMATIF|NASKAH\s+SOAL|MATA\s+PELAJARAN|KELAS\s*:|WAKTU\s*:|HARI\/TANGGAL|TAHUN\s+AJARAN|PETUNJUK\s+UMUM)/i.test(
          line
        )
      ) {
        continue;
      }
    }

    // Check section heading
    const secHint = detectSectionTypeHint(line);
    if (secHint) {
      pushCurrent();
      activeSectionHint = secHint;
      pendingPassage = '';
      continue;
    }

    // Check passage / stimulus directive before next question
    if (/^(?:bacalah\s+(?:teks|bacaan|paragraf|cerita|puisi|tabel)|perhatikan\s+(?:teks|bacaan|pernyataan))/i.test(line)) {
      pushCurrent();
      pendingPassage = line;
      continue;
    }

    // Check metadata lines inside current question
    if (current) {
      const typeMeta = line.match(/^(?:Bentuk|Tipe|Jenis)\s*(?:Soal)?\s*[:=]\s*(.+)$/i);
      if (typeMeta) {
        const inferred = detectQuestionTypeValue(typeMeta[1]);
        if (inferred) current.explicitType = inferred;
        continue;
      }
      const keyMeta = line.match(/^(?:Kunci(?:\s+Jawaban)?|Jawaban(?:\s+Benar)?|Pedoman\s+Jawaban)\s*[:=]\s*(.+)$/i);
      if (keyMeta) {
        current.rawKey = keyMeta[1].trim();
        continue;
      }
      const rubricMeta = line.match(/^(?:Rubrik(?:\s+Penskoran)?|Pedoman(?:\s+Penskoran)?|Pembahasan)\s*[:=]\s*(.+)$/i);
      if (rubricMeta) {
        current.rubric = rubricMeta[1].trim();
        continue;
      }
      const scoreWeightMeta = line.match(/^(?:Skor(?:\s+Maks(?:imal)?)?|Bobot(?:\s+Soal)?)\s*[:=]/i);
      if (scoreWeightMeta) {
        const sM = line.match(/Skor(?:\s+Maks(?:imal)?)?\s*[:=]\s*(\d+(?:[.,]\d+)?)/i);
        const wM = line.match(/Bobot(?:\s+Soal)?\s*[:=]\s*(\d+(?:[.,]\d+)?)/i);
        if (sM) current.maxScore = parseFloat(sM[1].replace(',', '.'));
        if (wM) current.weight = parseFloat(wM[1].replace(',', '.'));
        continue;
      }
    }

    // Check nested list item option (from Word <ol><ol><li>)
    if (block.kind === 'list-item' && (block.listLevel ?? 1) >= 2 && current) {
      const letterIdx = current.options.length;
      if (letterIdx < 5) {
        const id = String.fromCharCode(65 + letterIdx);
        const marked = Boolean(
          block.markedHtml && block.markedHtml.includes(MARK_START) && cleanMarks(block.markedHtml) === line
        );
        // Strip leading A. / a. if author also typed letter manually
        const stripped = line.replace(/^[A-Ea-e]\s*[.)]\s+/, '').trim();
        current.options.push({ id, text: stripped, isMarked: marked });
        continue;
      }
    }

    // Check inline options A. ... B. ... C. ... D. ...
    const inlineOpts = splitInlineOptions(line);
    if (inlineOpts && current) {
      for (const opt of inlineOpts) {
        if (!current.options.some((existing) => existing.id === opt.id)) {
          current.options.push(opt);
        }
      }
      continue;
    }

    // Check single option line "A. teks" / "a) teks"
    const optMatch = line.match(/^([A-Ea-e])\s*[.)]\s+(.+)$/);
    if (optMatch && current) {
      const optId = optMatch[1].toUpperCase();
      // Guard against section header "A. Pilihan Ganda" already handled above
      const isMarked = Boolean(
        block.markedHtml &&
          block.markedHtml.includes(MARK_START) &&
          !block.markedHtml.startsWith(MARK_START + optMatch[1])
      );
      current.options.push({
        id: optId,
        text: optMatch[2].trim(),
        isMarked,
      });
      continue;
    }

    // Check explicit question start: "1. ..." / "1) ..." / "Soal 1: ..."
    const qStartMatch = line.match(/^(?:No\.?\s*|Soal\s+)?(\d{1,3})\s*[.):]\s+(.+)$/i);
    if (qStartMatch && (!current || current.options.length > 0 || activeSectionHint === 'uraian' || activeSectionHint === 'isian_singkat' || qStartMatch[1] !== '0')) {
      const qNum = parseInt(qStartMatch[1], 10);
      // Avoid treating years like "2026." inside a sentence as question number
      if (qNum >= 1 && qNum <= 200) {
        pushCurrent();
        autoQuestionCounter = qNum;
        current = {
          number: qNum,
          sectionHint: activeSectionHint,
          explicitType: null,
          promptLines: [qStartMatch[2].trim()],
          passage: pendingPassage || undefined,
          options: [],
        };
        pendingPassage = '';
        continue;
      }
    }

    // Check top-level Word auto-numbered <ol><li>
    if (block.kind === 'list-item' && (block.listLevel ?? 1) === 1 && block.listOrdered) {
      pushCurrent();
      autoQuestionCounter += 1;
      current = {
        number: autoQuestionCounter,
        sectionHint: activeSectionHint,
        explicitType: null,
        promptLines: [line],
        passage: pendingPassage || undefined,
        options: [],
      };
      pendingPassage = '';
      continue;
    }

    // Continuation line
    if (current) {
      if (current.options.length > 0) {
        // Append to last option if multi-line option
        const lastOpt = current.options[current.options.length - 1];
        lastOpt.text = `${lastOpt.text} ${line}`.trim();
      } else {
        current.promptLines.push(line);
      }
    } else if (pendingPassage) {
      pendingPassage = `${pendingPassage}\n${line}`;
    }
  }

  pushCurrent();

  return drafts.map((draft, idx) =>
    finalizeDraftQuestion(
      draft,
      idx,
      bottomKeyMap.get(draft.number),
      defaultSubject
    )
  );
}
