import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = "/Users/sne/Downloads/GMT20260815-103652_Recording.transcript.vtt";
const outputPath = path.resolve("webinar/references/meeting-2026-08-15/transcript.md");

function cleanTimestamp(value: string): string {
  return value.trim().replace(/\.\d{3}$/, "");
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1");
}

const source = await readFile(sourcePath, "utf8");
const entries: string[] = [];

for (const block of source.replace(/^\uFEFF/, "").split(/\r?\n\r?\n/)) {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const timingIndex = lines.findIndex((line) => line.includes(" --> "));
  if (timingIndex < 0) continue;
  const [rawStart, rawEndWithSettings] = lines[timingIndex].split(" --> ");
  const rawEnd = rawEndWithSettings.split(/\s+/, 1)[0];
  const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (!text) continue;
  const speakerMatch = text.match(/^([^:]{1,80}):\s*(.*)$/);
  const body = speakerMatch ? speakerMatch[2] : text;
  const speaker = speakerMatch ? ` **${escapeMarkdown(speakerMatch[1])}:**` : "";
  entries.push(`- [${cleanTimestamp(rawStart)}–${cleanTimestamp(rawEnd)}]${speaker} ${body}`);
}

if (entries.length === 0) throw new Error("VTT contains no transcript cues");

const output = [
  "# Транскрипт прогона вебинара с Сашей",
  "",
  "Дата записи: 15 августа 2026. Источник: Zoom VTT auto-transcript. Текст не подвергался смысловой редактуре; исправлены только формат и разметка спикеров.",
  "",
  ...entries,
  "",
].join("\n");

await mkdir(path.dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
await writeFile(temporaryPath, output, { mode: 0o600 });
await rename(temporaryPath, outputPath);
console.log(JSON.stringify({ entries: entries.length, characters: output.length, outputPath }));
