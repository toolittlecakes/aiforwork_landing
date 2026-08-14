import { GoogleGenAI, MediaResolution } from "@google/genai";
import { readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const artifactDir = "/Users/sne/.bb/thread-storage/thr_if6bp392a4/youtube-f2yzcsByUUU";
const videoPath = path.join(artifactDir, "source.mp4");
const expectedDurationSeconds = 8241.281;

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

async function writeJsonAtomic(name: string, value: unknown): Promise<void> {
  const target = path.join(artifactDir, name);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

const schema = {
  type: "object",
  properties: {
    duration_seconds: { type: "number", description: "Observed full video duration in seconds." },
    slide_occurrences: {
      type: "array",
      description: "Chronological intervals for every visually distinct presentation slide or meaningful build state. Reuse slide_id when the same slide returns unchanged.",
      items: {
        type: "object",
        properties: {
          slide_id: { type: "string", description: "Stable identifier such as slide-001; identical unchanged visuals reuse the same id." },
          start_seconds: { type: "number", description: "First second this slide state is visible." },
          end_seconds: { type: "number", description: "Last second before the next distinct slide state." },
          kind: { type: "string", enum: ["slide", "slide_build", "demo", "speaker_only", "other"] },
          visible_text: { type: "string", description: "Only text legible with confidence; empty when unreadable." },
          visual_summary: { type: "string", description: "Concise description sufficient to distinguish this state from adjacent states." },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["slide_id", "start_seconds", "end_seconds", "kind", "visible_text", "visual_summary", "confidence"],
      },
    },
    extraction_notes: {
      type: "array",
      description: "Uncertainties or limitations that materially affect the transcript or slide map.",
      items: { type: "string" },
    },
  },
  required: ["duration_seconds", "slide_occurrences", "extraction_notes"],
};

const prompt = `Analyze the entire attached Russian-language webinar recording from 00:00 through 02:17:21 (${expectedDurationSeconds} seconds).

Produce a complete chronological map of presentation visuals. Record every true slide change and every meaningful slide build/animation that changes the communicated content. Do not create a new slide occurrence for cursor movement, tiny webcam changes, compression artifacts, or ordinary speaker motion. Reuse slide_id when an identical slide returns unchanged. Include demos and speaker-only intervals so the map covers the whole recording.

The downloaded source is 1920x1080 and the API samples it at 1 FPS. Use audio only to disambiguate what a visual state represents; a separate YouTube transcript already exists. Never invent unreadable slide text: leave visible_text empty and explain uncertainty in extraction_notes. Ensure timestamps are ordered, non-negative, and do not exceed ${expectedDurationSeconds}. The visual map must cover the full recording.`;

const ai = new GoogleGenAI({ apiKey: await apiKey() });
console.log("Uploading source.mp4 to Gemini Files API...");
const uploaded = await ai.files.upload({ file: videoPath, config: { mimeType: "video/mp4", displayName: "webinar-reference-f2yzcsByUUU" } });
if (!uploaded.name || !uploaded.uri) throw new Error("Gemini upload response is missing file identity");
await writeJsonAtomic("gemini-upload.json", { name: uploaded.name, uri: uploaded.uri, mimeType: uploaded.mimeType, state: uploaded.state });

let current = uploaded;
while (current.state !== "ACTIVE") {
  if (current.state === "FAILED") throw new Error(`Gemini file processing failed: ${current.name}`);
  await Bun.sleep(5000);
  current = await ai.files.get({ name: uploaded.name });
  console.log(`Gemini file state: ${current.state ?? "unknown"}`);
}
if (!current.uri || !current.mimeType) throw new Error("Active Gemini file is missing URI or MIME type");

console.log("Generating structured slide map with gemini-3.6-flash...");
const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: [{
    role: "user",
    parts: [
      { fileData: { fileUri: current.uri, mimeType: current.mimeType }, videoMetadata: { fps: 1 } },
      { text: prompt },
    ],
  }],
  config: {
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
    responseMimeType: "application/json",
    responseJsonSchema: schema,
    maxOutputTokens: 65536,
  },
});

await writeJsonAtomic("gemini-response-metadata.json", {
  modelVersion: response.modelVersion,
  finishReason: response.candidates?.[0]?.finishReason,
  usageMetadata: response.usageMetadata,
});
if (response.candidates?.[0]?.finishReason !== "STOP") throw new Error(`Unexpected Gemini finish reason: ${response.candidates?.[0]?.finishReason}`);
if (!response.text) throw new Error("Gemini response has no text");

const result = JSON.parse(response.text) as {
  duration_seconds: number;
  slide_occurrences: Array<{ slide_id: string; start_seconds: number; end_seconds: number; kind: string; visible_text: string; visual_summary: string; confidence: string }>;
  extraction_notes: string[];
};

function validateIntervals(items: Array<{ start_seconds: number; end_seconds: number }>, label: string): void {
  let previousStart = -1;
  for (const [index, item] of items.entries()) {
    if (item.start_seconds < 0 || item.end_seconds < item.start_seconds || item.end_seconds > expectedDurationSeconds + 2 || item.start_seconds < previousStart) {
      throw new Error(`${label}[${index}] has invalid interval ${item.start_seconds}-${item.end_seconds}`);
    }
    previousStart = item.start_seconds;
  }
}

if (Math.abs(result.duration_seconds - expectedDurationSeconds) > 5) throw new Error(`Duration mismatch: ${result.duration_seconds}`);
if (result.slide_occurrences.length === 0) throw new Error("Gemini returned an empty slide map");
validateIntervals(result.slide_occurrences, "slide_occurrences");
await writeJsonAtomic("analysis.json", result);
console.log(JSON.stringify({ slideOccurrences: result.slide_occurrences.length, durationSeconds: result.duration_seconds }));
