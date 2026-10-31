import { skillById, skills } from './catalogue';
import { extractAliases } from './engine';
import type { SkillId } from './types';

export type SkillLevelChange = {
  skillId: SkillId;
  label: string;
  before: number;
  after: number;
};

export type ParsedMemberReport = {
  skills: Partial<Record<SkillId, number>>;
  changes: SkillLevelChange[];
  matchedSkills: SkillId[];
  summary: string;
};

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function xmlToPlainText(xml: string): string {
  const withBreaks = xml
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<\/w:tr>/gi, '\n')
    .replace(/<w:br\b[^>]*\/?>/gi, '\n')
    .replace(/<w:cr\b[^>]*\/?>/gi, '\n')
    .replace(/<\/w:tc>/gi, '\t')
    .replace(/<w:tab\b[^>]*\/?>/gi, '\t');

  const paragraphs = withBreaks.split('\n').map((line) => {
    const tokens = [...line.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi)];
    if (tokens.length > 0) {
      return decodeXmlEntities(tokens.map((m) => m[1]).join(''))
        .replace(/\s+/g, ' ')
        .trim();
    }
    return decodeXmlEntities(line.replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
  });

  return paragraphs.filter(Boolean).join('\n').trim();
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const copy = new Uint8Array(compressed.byteLength);
    copy.set(compressed);
    await writer.write(copy);
    await writer.close();
    const response = new Response(ds.readable);
    const ab = await response.arrayBuffer();
    return new Uint8Array(ab);
  }
  return compressed;
}

type ZipEntryInfo = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function findCentralDirectoryEntries(bytes: Uint8Array): ZipEntryInfo[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minEocdOffset = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minEocdOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return [];

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntryInfo[] = [];
  let ptr = cdOffset;

  for (let i = 0; i < totalEntries && ptr + 46 <= bytes.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(
      bytes.subarray(ptr + 46, ptr + 46 + fileNameLen),
    );
    entries.push({
      name,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });
    ptr += 46 + fileNameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * Extracts plain text from a `.docx` or `.doc` ArrayBuffer using mammoth if installed,
 * with a zero-dependency ZIP/XML + binary string fallback.
 */
export async function extractWordDocumentText(
  arrayBuffer: ArrayBuffer,
): Promise<string> {
  // 1. Try mammoth if present in the environment
  try {
    const moduleName = 'mammoth';
    const mammothModule = (await import(
      /* webpackIgnore: true */ moduleName
    ).catch(() => null)) as {
      extractRawText?: (input: {
        arrayBuffer: ArrayBuffer;
      }) => Promise<{ value: string }>;
    } | null;
    if (mammothModule && typeof mammothModule.extractRawText === 'function') {
      const res = await mammothModule.extractRawText({ arrayBuffer });
      if (res?.value?.trim()) return res.value.trim();
    }
  } catch {
    /* Fall through to built-in parser */
  }

  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 4) return '';
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // 2. Check for PKZIP header (.docx)
  if (view.getUint32(0, true) === 0x04034b50) {
    const decoder = new TextDecoder('utf-8');
    const xmlChunks: string[] = [];

    const cdEntries = findCentralDirectoryEntries(bytes);
    if (cdEntries.length > 0) {
      for (const entry of cdEntries) {
        if (!/^word\/(?:document|header\d*|footer\d*)\.xml$/i.test(entry.name))
          continue;
        const lh = entry.localHeaderOffset;
        if (lh + 30 > bytes.length || view.getUint32(lh, true) !== 0x04034b50)
          continue;
        const nameLen = view.getUint16(lh + 26, true);
        const extraLen = view.getUint16(lh + 28, true);
        const dataStart = lh + 30 + nameLen + extraLen;
        const dataEnd = Math.min(
          bytes.length,
          dataStart + entry.compressedSize,
        );
        const slice = bytes.subarray(dataStart, dataEnd);
        try {
          const rawXml =
            entry.compressionMethod === 0
              ? decoder.decode(slice)
              : entry.compressionMethod === 8
                ? decoder.decode(await inflateRawBytes(slice))
                : '';
          if (rawXml) xmlChunks.push(xmlToPlainText(rawXml));
        } catch {
          /* Ignore malformed entry */
        }
      }
    }

    // Fallback sequential local-header walk if Central Directory was not found
    if (xmlChunks.length === 0) {
      let offset = 0;
      while (offset + 30 <= bytes.length) {
        if (view.getUint32(offset, true) !== 0x04034b50) break;
        const compressionMethod = view.getUint16(offset + 8, true);
        const compressedSize = view.getUint32(offset + 18, true);
        const fileNameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);
        const name = decoder.decode(
          bytes.subarray(offset + 30, offset + 30 + fileNameLen),
        );
        const dataStart = offset + 30 + fileNameLen + extraLen;
        if (compressedSize === 0) break;
        const slice = bytes.subarray(
          dataStart,
          Math.min(bytes.length, dataStart + compressedSize),
        );
        if (/^word\/(?:document|header\d*|footer\d*)\.xml$/i.test(name)) {
          try {
            const rawXml =
              compressionMethod === 0
                ? decoder.decode(slice)
                : compressionMethod === 8
                  ? decoder.decode(await inflateRawBytes(slice))
                  : '';
            if (rawXml) xmlChunks.push(xmlToPlainText(rawXml));
          } catch {
            /* Continue scanning */
          }
        }
        offset = dataStart + compressedSize;
      }
    }

    const joined = xmlChunks.filter(Boolean).join('\n').trim();
    if (joined) return joined;
  }

  // 3. Fallback for legacy .doc (OLE2 binary / RTF / UTF-16LE / ASCII text runs)
  const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  if (utf8Text.includes('<w:t')) {
    const extracted = xmlToPlainText(utf8Text);
    if (extracted) return extracted;
  }

  const oleNoise =
    /^(?:Root Entry|WordDocument|1Table|0Table|Data|ObjectPool|CompObj|SummaryInformation|DocumentSummaryInformation|Normal\.dotm?|Microsoft Word|MSWordDoc|Times New Roman|Calibri|Arial)$/i;

  const asciiRuns =
    utf8Text
      .match(/[\x20-\x7E\r\n\t]{4,}/g)
      ?.map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length >= 3 && !oleNoise.test(chunk)) ?? [];

  const utf16Runs: string[] = [];
  let currentRun = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (
      (code >= 0x20 && code <= 0x7e) ||
      code === 0x0a ||
      code === 0x0d ||
      code === 0x09
    ) {
      currentRun += String.fromCharCode(code);
    } else {
      if (currentRun.trim().length >= 4 && !oleNoise.test(currentRun.trim())) {
        utf16Runs.push(currentRun.trim());
      }
      currentRun = '';
    }
  }
  if (currentRun.trim().length >= 4 && !oleNoise.test(currentRun.trim())) {
    utf16Runs.push(currentRun.trim());
  }

  return [...asciiRuns, ...utf16Runs].join('\n').trim();
}

/**
 * Extracts text from an uploaded report file (.docx, .doc, .pdf, .txt, .csv).
 */
export async function extractReportTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    type === 'application/msword' ||
    type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const buffer = await file.arrayBuffer();
    const extracted = await extractWordDocumentText(buffer);
    if (extracted) return extracted;
    return (await file.text()).trim();
  }

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    const form = new FormData();
    form.set('file', file);
    form.set('processingConsent', 'true');
    const response = await fetch('/api/pdf', {
      method: 'POST',
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(String(data.error ?? 'Could not read PDF file.'));
    }
    return String(data.text ?? '').trim();
  }

  return (await file.text()).trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLevelFromSegment(segment: string): number | null {
  // 1. Explicit level/tier/score/rating numbers: e.g. "Level 3", "Lvl 2", "Tier 3", "Rating: 3"
  const explicitLevel =
    /\b(?:level|lvl|tier|rating|score|grade|proficiency|tahap|等级|级别)\s*[:=\-–]?\s*([123])\b/i.exec(
      segment,
    );
  if (explicitLevel) return Number(explicitLevel[1]);

  // 2. Ratio numbers like "3/3" or "2/3"
  const ratioThree = /\b([123])\s*\/\s*3\b/.exec(segment);
  if (ratioThree) return Number(ratioThree[1]);

  // 3. Direct separator number: e.g. "Communication: 3", "Communication - 3", "Communication (3)", "Communication, 3"
  const directNumber =
    /(?:[:=\-–|,;\t]\s*|\(\s*|\[\s*|\s+)([123])(?:\s*(?:\)|\]|$|[,;|.\r\n]|out of 3|-\s*(?:basic|independent|advanced)))/i.exec(
      segment,
    );
  if (directNumber) return Number(directNumber[1]);

  // 4. Qualitative proficiency words
  if (
    /\b(?:advanced|expert|mastery|master|lead|senior|strong|excellent|high|mahir|高级|精通)\b/i.test(
      segment,
    )
  ) {
    return 3;
  }
  if (
    /\b(?:independent|intermediate|working|competent|solid|good|moderate|pertengahan|中级|独立)\b/i.test(
      segment,
    )
  ) {
    return 2;
  }
  if (
    /\b(?:basic|beginner|foundation|foundational|introductory|elementary|novice|developing|asas|初级|基础)\b/i.test(
      segment,
    )
  ) {
    return 1;
  }

  return null;
}

/**
 * Parses an uploaded member report's plain text and returns updated skill levels
 * alongside a diff of changed skills for that specific member.
 */
export function parseMemberReportSkills(
  text: string,
  currentSkills: Partial<Record<SkillId, number>>,
  memberName = 'Team member',
): ParsedMemberReport {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const nextSkills: Partial<Record<SkillId, number>> = { ...currentSkills };
  const detectedLevels = new Map<SkillId, number>();

  const segments = cleanText
    .split(/[\n;|]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const segment of segments) {
    for (const skill of skills) {
      const terms = [skill.label, skill.id, ...skill.aliases]
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .sort((a, b) => b.length - a.length);

      for (const term of terms) {
        const pattern = new RegExp(
          `(?:^|[^\\p{L}\\p{N}])(${escapeRegExp(term)})(?=$|[^\\p{L}\\p{N}])`,
          'iu',
        );
        const match = pattern.exec(segment);
        if (!match) continue;

        const matchStart = match.index + match[0].length - match[1].length;
        const afterText = segment.slice(
          matchStart + match[1].length,
          matchStart + match[1].length + 60,
        );
        const beforeText = segment.slice(
          Math.max(0, matchStart - 30),
          matchStart,
        );

        const parsedLevel =
          parseLevelFromSegment(afterText) ??
          parseLevelFromSegment(beforeText) ??
          parseLevelFromSegment(segment);

        if (parsedLevel !== null) {
          const prev = detectedLevels.get(skill.id) ?? 0;
          if (parsedLevel > prev) detectedLevels.set(skill.id, parsedLevel);
        } else if (!detectedLevels.has(skill.id)) {
          const existing = currentSkills[skill.id] ?? 0;
          const bumped = Math.min(3, Math.max(1, existing + 1));
          detectedLevels.set(skill.id, bumped);
        }
        break;
      }
    }
  }

  // Also run catalogue alias extraction across full text for any remaining mentions
  for (const found of extractAliases(cleanText)) {
    if (!detectedLevels.has(found.id)) {
      const existing = currentSkills[found.id] ?? 0;
      detectedLevels.set(found.id, Math.min(3, Math.max(1, existing + 1)));
    }
  }

  const changes: SkillLevelChange[] = [];
  const matchedSkills: SkillId[] = [];

  for (const [skillId, level] of detectedLevels.entries()) {
    const clamped = Math.max(1, Math.min(3, Math.round(level)));
    const before = currentSkills[skillId] ?? 0;
    nextSkills[skillId] = clamped;
    matchedSkills.push(skillId);
    if (clamped !== before) {
      changes.push({
        skillId,
        label: skillById[skillId].label,
        before,
        after: clamped,
      });
    }
  }

  const summary =
    changes.length > 0
      ? `Updated ${memberName}: ${changes
          .map((c) => `${c.label} ${c.before} → ${c.after}`)
          .join(', ')}`
      : matchedSkills.length > 0
        ? `Verified ${memberName}: ${matchedSkills
            .map((id) => `${skillById[id].label} (${nextSkills[id] ?? 1})`)
            .join(', ')}`
        : `No new skill changes detected for ${memberName}.`;

  return {
    skills: nextSkills,
    changes,
    matchedSkills,
    summary,
  };
}
