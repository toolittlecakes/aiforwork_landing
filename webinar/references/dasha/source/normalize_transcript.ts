import { readFile, writeFile } from "node:fs/promises";

const directory = "/Users/sne/.bb/thread-storage/thr_if6bp392a4/youtube-f2yzcsByUUU";
const source = JSON.parse(await readFile(`${directory}/youtube-transcript.ru-orig.json3`, "utf8")) as {
  events: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }>;
};

type Bucket = { startMs: number; endMs: number; text: string };
const buckets = new Map<number, Bucket>();

for (const event of source.events) {
  if (event.tStartMs === undefined || !event.segs) continue;
  const text = event.segs.map((segment) => segment.utf8 ?? "").join("").replace(/\s+/g, " ").trim();
  if (!text) continue;
  const bucketId = Math.floor(event.tStartMs / 30_000);
  const endMs = event.tStartMs + (event.dDurationMs ?? 0);
  const bucket = buckets.get(bucketId);
  if (bucket) {
    bucket.endMs = Math.max(bucket.endMs, endMs);
    bucket.text = `${bucket.text} ${text}`;
  } else {
    buckets.set(bucketId, { startMs: event.tStartMs, endMs, text });
  }
}

function timestamp(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

const lines = [
  "# Транскрипт вебинара",
  "",
  "Источник: автоматические субтитры YouTube `Russian (Original)`. Текст сгруппирован в 30-секундные интервалы без смысловой редакторской правки.",
  "",
  ...[...buckets.values()].map((bucket) => `- [${timestamp(bucket.startMs)}–${timestamp(bucket.endMs)}] ${bucket.text}`),
  "",
];

await writeFile(`${directory}/transcript.md`, lines.join("\n"), { mode: 0o600 });
console.log(JSON.stringify({ buckets: buckets.size, characters: lines.join("\n").length }));
