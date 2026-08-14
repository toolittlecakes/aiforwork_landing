import { mkdir, readdir } from "node:fs/promises";

const directory = "/Users/sne/.bb/thread-storage/thr_if6bp392a4/youtube-f2yzcsByUUU";
const detected = await readdir(`${directory}/scene-detection`);
const seconds = detected
  .map((name) => name.match(/^scene-(\d+)\.jpg$/)?.[1])
  .filter((value): value is string => value !== undefined)
  .map(Number)
  .sort((left, right) => left - right);

if (seconds.length === 0) throw new Error("No detected scene timestamps");
const outputDirectory = `${directory}/slides`;
await mkdir(outputDirectory, { recursive: true });

const selectExpression = seconds.map((second) => `eq(n\\,${second})`).join("+");
const process = Bun.spawn([
  "ffmpeg",
  "-hide_banner",
  "-loglevel", "error",
  "-i", `${directory}/source.mp4`,
  "-vf", `fps=1,select=${selectExpression}`,
  "-vsync", "vfr",
  "-frame_pts", "1",
  "-q:v", "2",
  `${outputDirectory}/slide-%06d.jpg`,
], { stdout: "inherit", stderr: "inherit" });

const exitCode = await process.exited;
if (exitCode !== 0) throw new Error(`ffmpeg exited with ${exitCode}`);
const output = (await readdir(outputDirectory)).filter((name) => name.endsWith(".jpg"));
if (output.length !== seconds.length) throw new Error(`Expected ${seconds.length} slides, got ${output.length}`);
console.log(JSON.stringify({ slides: output.length, firstSecond: seconds[0], lastSecond: seconds.at(-1) }));
