import { GoogleGenAI, MediaResolution } from "@google/genai";
import { readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = path.resolve(".");
const artifactDir = path.join(root, "webinar/references/meeting-2026-08-15");
const videoPath = "/Users/sne/Downloads/GMT20260815-103652_Recording_as_1512x982.mp4";
const deckPath = path.join(root, "webinar/presentation/webinar-ai-for-work.pdf");
const expectedDurationSeconds = 6931.648;
const model = "gemini-3.6-flash";

const contextPaths = [
  "webinar/README.md",
  "webinar/presentation/README.md",
  "webinar/presentation/index.html",
  "webinar/feedback.md",
  "webinar/feedback2.md",
  "webinar/references/meeting-2026-08-10/insights-for-webinar.md",
];

type Recommendation = {
  id: number;
  scope: "slides" | "structure" | "offer" | "delivery" | "moderation" | "operations";
  source: "sasha_explicit" | "nikolay_decision" | "inferred_from_discussion";
  priority: "critical" | "high" | "medium" | "low";
  status: "not_implemented" | "partially_implemented" | "already_implemented" | "unclear";
  recording_start_seconds: number;
  recording_end_seconds: number;
  speaker: string;
  slide_reference: string;
  evidence_summary: string;
  current_state: string;
  recommendation: string;
  suggested_copy_or_structure: string;
  rationale: string;
  confidence: "high" | "medium" | "low";
};

type Analysis = {
  recording_duration_seconds: number;
  recommendations: Recommendation[];
  global_notes: string[];
  uncertainties: string[];
};

async function apiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envText = await readFile(path.join(os.homedir(), ".env"), "utf8");
  const match = envText.match(/^\s*(?:export\s+)?GEMINI_API_KEY\s*=\s*(.*)\s*$/m);
  if (!match) throw new Error("GEMINI_API_KEY is not configured");
  const raw = match[1].trim().split(/\s+#/, 1)[0].trim();
  const value = ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) ? raw.slice(1, -1) : raw;
  if (!value) throw new Error("GEMINI_API_KEY is empty");
  return value;
}

async function writeAtomic(name: string, value: string): Promise<void> {
  const target = path.join(artifactDir, name);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, value, { mode: 0o600 });
  await rename(temporary, target);
}

async function writeJsonAtomic(name: string, value: unknown): Promise<void> {
  await writeAtomic(name, `${JSON.stringify(value, null, 2)}\n`);
}

function statusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  for (const key of ["status", "statusCode", "code"]) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  }
  return undefined;
}

async function withTransientRetry<T>(label: string, action: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      const status = statusCode(error);
      const transient = status === 429 || (status !== undefined && status >= 500);
      if (!transient || attempt === 3) throw error;
      const delayMs = 2_000 * 2 ** (attempt - 1);
      console.error(`${label} transient failure ${status}; retry ${attempt}/2 after ${delayMs}ms`);
      await Bun.sleep(delayMs);
    }
  }
  throw new Error(`${label} retry loop exhausted`);
}

const schema = {
  type: "object",
  properties: {
    recording_duration_seconds: { type: "number", description: "Observed duration of the recording in seconds." },
    recommendations: {
      type: "array",
      description: "Complete deduplicated chronological list of explicit and strongly implied recommendations from the review conversation.",
      items: {
        type: "object",
        properties: {
          id: { type: "integer", description: "Consecutive integer starting at 1." },
          scope: { type: "string", enum: ["slides", "structure", "offer", "delivery", "moderation", "operations"] },
          source: { type: "string", enum: ["sasha_explicit", "nikolay_decision", "inferred_from_discussion"] },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          status: { type: "string", enum: ["not_implemented", "partially_implemented", "already_implemented", "unclear"] },
          recording_start_seconds: { type: "number", description: "Start of the supporting discussion in the recording." },
          recording_end_seconds: { type: "number", description: "End of the supporting discussion in the recording." },
          speaker: { type: "string", description: "Sasha, Nikolay, or both." },
          slide_reference: { type: "string", description: "Current slide number/title or an exact structural location; use 'not slide-specific' when appropriate." },
          evidence_summary: { type: "string", description: "Faithful concise summary of what was said or observed, without invented quotation." },
          current_state: { type: "string", description: "What the supplied current deck already does about this point." },
          recommendation: { type: "string", description: "Concrete action: what to change, where, and how." },
          suggested_copy_or_structure: { type: "string", description: "Ready-to-use wording, ordering, interaction, or delivery instruction; empty only when genuinely inapplicable." },
          rationale: { type: "string", description: "Why the change matters for comprehension, trust, persuasion, pacing, or conversion." },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["id", "scope", "source", "priority", "status", "recording_start_seconds", "recording_end_seconds", "speaker", "slide_reference", "evidence_summary", "current_state", "recommendation", "suggested_copy_or_structure", "rationale", "confidence"],
      },
    },
    global_notes: { type: "array", items: { type: "string" }, description: "Cross-cutting observations that help interpret the recommendation list." },
    uncertainties: { type: "array", items: { type: "string" }, description: "Material uncertainties caused by audio, unreadable visuals, or conflicts between recording and current deck." },
  },
  required: ["recording_duration_seconds", "recommendations", "global_notes", "uncertainties"],
};

const context = (
  await Promise.all(contextPaths.map(async (relativePath) => `\n\n===== ${relativePath} =====\n${await readFile(path.join(root, relativePath), "utf8")}`))
).join("");

const prompt = `You are reviewing a Russian-language rehearsal and feedback session for an expert sales webinar about learning AI agents. Analyze the entire attached video from 00:00 through 01:55:31.648. The video must be treated as the primary source for what Sasha and Nikolay actually say and what slide is visible. The attached PDF and text below represent the CURRENT deck after some edits made later on August 15.

Create one complete, concrete, deduplicated recommendation inventory. Capture every explicit recommendation from Sasha, every decision or unresolved concern stated by Nikolay, and only strong implications that are clearly supported by the conversation. Cover slide copy, additions/removals/reordering, story structure, audience interaction, examples and proof, product bridge, offer/urgency/CTA, moderation and operational setup, and recommendations about what/how Nikolay should say that do not require slide edits.

For each item, identify the current slide or exact location, evidence timestamps, what the current deck already contains, the exact action, and ready-to-use wording or structure when possible. Compare against the current PDF/HTML so recommendations already implemented after the recording are marked already_implemented instead of being requested again. Do not claim visual implementation from old slides shown inside the video. Keep slide-changing items separate from delivery-only items through scope. Use paraphrased evidence, not invented verbatim quotes. Do not invent facts, pricing, cases, outcomes, scarcity, or promises. Deduplicate repeated discussion into one recommendation with the full supporting time range.

The recording is sampled at exactly 1 FPS. Ordinary cursor/webcam motion is irrelevant; inspect slides only enough to locate feedback. The result must be exhaustive but operational: another editor should be able to implement it without rewatching the recording.

Current project context follows:${context}`;

const ai = new GoogleGenAI({ apiKey: await apiKey(), httpOptions: { timeout: 1_800_000 } });

async function uploadAndActivate(file: string, mimeType: string, displayName: string) {
  console.log(`Uploading ${path.basename(file)} to Gemini Files API...`);
  const uploaded = await withTransientRetry(`upload ${displayName}`, () => ai.files.upload({ file, config: { mimeType, displayName } }));
  if (!uploaded.name || !uploaded.uri) throw new Error(`Gemini upload response for ${displayName} is missing file identity`);
  let current = uploaded;
  while (current.state !== "ACTIVE") {
    if (current.state === "FAILED") throw new Error(`Gemini file processing failed: ${current.name}`);
    await Bun.sleep(5_000);
    current = await withTransientRetry(`poll ${displayName}`, () => ai.files.get({ name: uploaded.name! }));
    console.log(`${displayName} state: ${current.state ?? "unknown"}`);
  }
  if (!current.uri || !current.mimeType) throw new Error(`Active Gemini file ${displayName} is missing URI or MIME type`);
  return current;
}

const video = await uploadAndActivate(videoPath, "video/mp4", "webinar-rehearsal-2026-08-15");
const deck = await uploadAndActivate(deckPath, "application/pdf", "current-webinar-deck-2026-08-15");
await writeJsonAtomic("gemini-upload.json", {
  video: { name: video.name, uri: video.uri, mimeType: video.mimeType, state: video.state },
  deck: { name: deck.name, uri: deck.uri, mimeType: deck.mimeType, state: deck.state },
});

const baseConfig = {
  mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
  responseMimeType: "application/json",
  responseJsonSchema: schema,
  maxOutputTokens: 65_536,
};

const contents = [{
  role: "user",
  parts: [
    { fileData: { fileUri: video.uri!, mimeType: video.mimeType! }, videoMetadata: { fps: 1 } },
    { fileData: { fileUri: deck.uri!, mimeType: deck.mimeType! } },
    { text: prompt },
  ],
}];

async function generate(safetySettings?: Array<{ category: string; threshold: string }>) {
  return withTransientRetry("generate analysis", () => ai.models.generateContent({
    model,
    contents,
    config: safetySettings ? { ...baseConfig, safetySettings } : baseConfig,
  }));
}

console.log(`Generating structured review with ${model} at 1 FPS...`);
let safetyProbeUsed = false;
let response;
try {
  response = await generate();
} catch (error) {
  if (statusCode(error) !== 400) throw error;
  safetyProbeUsed = true;
  console.error("Gemini returned 400; repeating the exact request once with adjustable safety filters OFF.");
  response = await generate([
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
  ]);
}

await writeJsonAtomic("gemini-response-metadata.json", {
  model,
  modelVersion: response.modelVersion,
  finishReason: response.candidates?.[0]?.finishReason,
  usageMetadata: response.usageMetadata,
  safetyProbeUsed,
});
if (response.candidates?.[0]?.finishReason !== "STOP") throw new Error(`Unexpected Gemini finish reason: ${response.candidates?.[0]?.finishReason}`);
if (!response.text) throw new Error("Gemini response has no text");

const result = JSON.parse(response.text) as Analysis;
if (Math.abs(result.recording_duration_seconds - expectedDurationSeconds) > 10) throw new Error(`Duration mismatch: ${result.recording_duration_seconds}`);
if (result.recommendations.length === 0) throw new Error("Gemini returned no recommendations");

const ids = new Set<number>();
for (const [index, item] of result.recommendations.entries()) {
  if (!Number.isInteger(item.id) || item.id !== index + 1 || ids.has(item.id)) throw new Error(`recommendations[${index}] has invalid id ${item.id}`);
  if (item.recording_start_seconds < 0 || item.recording_end_seconds < item.recording_start_seconds || item.recording_end_seconds > expectedDurationSeconds + 2) {
    throw new Error(`recommendations[${index}] has invalid interval ${item.recording_start_seconds}-${item.recording_end_seconds}`);
  }
  if (!item.recommendation.trim() || !item.slide_reference.trim() || !item.evidence_summary.trim()) throw new Error(`recommendations[${index}] is missing required content`);
  ids.add(item.id);
}

function timestamp(seconds: number): string {
  const rounded = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remaining = rounded % 60;
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, "0")).join(":");
}

const scopeTitles: Record<Recommendation["scope"], string> = {
  slides: "Слайды",
  structure: "Структура и драматургия",
  offer: "Оффер, срочность и CTA",
  delivery: "Что и как говорить",
  moderation: "Модерация и работа с аудиторией",
  operations: "Организация эфира",
};
const priorityTitles = { critical: "критический", high: "высокий", medium: "средний", low: "низкий" } as const;
const statusTitles = { not_implemented: "не реализовано", partially_implemented: "реализовано частично", already_implemented: "уже реализовано", unclear: "неясно" } as const;
const sourceTitles = { sasha_explicit: "явное замечание Саши", nikolay_decision: "решение/сомнение Николая", inferred_from_discussion: "сильный вывод из обсуждения" } as const;

const markdown: string[] = [
  "# Рекомендации из видеопрогона вебинара",
  "",
  `Источник: полная запись 15 августа 2026, проанализированная через Gemini Files API моделью \`${model}\` с частотой 1 FPS. Текущая презентация приложена отдельно и использована для проверки статуса изменений.`,
  "",
  `Всего дедуплицированных рекомендаций: ${result.recommendations.length}.`,
  "",
];

for (const scope of Object.keys(scopeTitles) as Recommendation["scope"][]) {
  const items = result.recommendations.filter((item) => item.scope === scope);
  if (items.length === 0) continue;
  markdown.push(`## ${scopeTitles[scope]}`, "");
  for (const item of items) {
    markdown.push(
      `### ${item.id}. ${item.slide_reference}`,
      "",
      `**Приоритет:** ${priorityTitles[item.priority]}. **Статус:** ${statusTitles[item.status]}. **Источник:** ${sourceTitles[item.source]}. **Уверенность:** ${item.confidence}. **Таймкод:** ${timestamp(item.recording_start_seconds)}–${timestamp(item.recording_end_seconds)} (${item.speaker}).`,
      "",
      `**Что обсуждали.** ${item.evidence_summary}`,
      "",
      `**Что сейчас.** ${item.current_state}`,
      "",
      `**Что сделать.** ${item.recommendation}`,
      "",
      `**Готовая формулировка / структура.** ${item.suggested_copy_or_structure || "Не требуется."}`,
      "",
      `**Зачем.** ${item.rationale}`,
      "",
    );
  }
}

if (result.global_notes.length > 0) markdown.push("## Сквозные наблюдения", "", ...result.global_notes.flatMap((note) => [`- ${note}`, ""]));
if (result.uncertainties.length > 0) markdown.push("## Неопределённости", "", ...result.uncertainties.flatMap((note) => [`- ${note}`, ""]));

await writeJsonAtomic("gemini-video-review.json", result);
await writeAtomic("gemini-video-review.md", `${markdown.join("\n").trim()}\n`);
console.log(JSON.stringify({ recommendations: result.recommendations.length, model, output: path.join(artifactDir, "gemini-video-review.md") }));
