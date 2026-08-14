import { readFile, readdir, writeFile } from "node:fs/promises";

const directory = "/Users/sne/.bb/thread-storage/thr_if6bp392a4/youtube-f2yzcsByUUU";
const analysis = JSON.parse(await readFile(`${directory}/analysis.json`, "utf8")) as {
  slide_occurrences: Array<{ slide_id: string; start_seconds: number; end_seconds: number; visible_text: string; visual_summary: string }>;
};
const localSeconds = (await readdir(`${directory}/scene-detection`))
  .map((name) => name.match(/^scene-(\d+)\.jpg$/)?.[1])
  .filter((value): value is string => value !== undefined)
  .map(Number)
  .sort((left, right) => left - right);

const nearest = (target: number, candidates: number[]): { second: number; distance: number } => {
  const second = candidates.reduce((best, candidate) => Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best);
  return { second, distance: Math.abs(second - target) };
};

const gemini = analysis.slide_occurrences.map((slide) => ({
  ...slide,
  nearest_local: nearest(slide.start_seconds, localSeconds),
}));
const unmatchedGemini = gemini.filter((slide) => slide.nearest_local.distance > 3);
const unmatchedLocal = localSeconds
  .map((second) => ({ second, nearest_gemini: nearest(second, analysis.slide_occurrences.map((slide) => slide.start_seconds)) }))
  .filter((item) => item.nearest_gemini.distance > 3);

const result = {
  counts: {
    gemini: gemini.length,
    local: localSeconds.length,
    gemini_without_local_match: unmatchedGemini.length,
    local_without_gemini_match: unmatchedLocal.length,
  },
  unmatched_gemini: unmatchedGemini,
  unmatched_local: unmatchedLocal,
};
await writeFile(`${directory}/scene-map-comparison.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify(result.counts));
