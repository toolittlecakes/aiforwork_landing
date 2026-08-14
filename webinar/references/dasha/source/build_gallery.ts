import { readdir, writeFile } from "node:fs/promises";

const sourceDirectory = "/Users/sne/.bb/thread-storage/thr_if6bp392a4/youtube-f2yzcsByUUU/contact-sheets-30s";
const outputPath = "/Users/sne/projects/aiforwork/landing/webinar-reference-gallery.html";
const files = (await readdir(sourceDirectory)).filter((name) => name.endsWith(".jpg")).sort();
const images: Array<{ name: string; data: string }> = [];

for (const file of files) {
  const process = Bun.spawn([
    "ffmpeg", "-hide_banner", "-loglevel", "error",
    "-i", `${sourceDirectory}/${file}`,
    "-vf", "scale=1800:-2",
    "-c:v", "libwebp", "-quality", "62",
    "-f", "image2pipe", "-",
  ], { stdout: "pipe", stderr: "inherit" });
  const bytes = new Uint8Array(await new Response(process.stdout).arrayBuffer());
  if (await process.exited !== 0) throw new Error(`ffmpeg failed for ${file}`);
  images.push({ name: file, data: Buffer.from(bytes).toString("base64") });
}

const cards = images.map(({ name, data }, index) => `
  <article class="sheet">
    <div class="meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${name}</span></div>
    <img loading="lazy" src="data:image/webp;base64,${data}" alt="Контакт-лист ${index + 1}">
  </article>`).join("");

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reference webinar — contact sheets</title>
<style>
:root{color-scheme:dark;--bg:#11100d;--card:#1b1915;--ink:#f3efe5;--muted:#9e9788;--accent:#b893ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 ui-sans-serif,system-ui,sans-serif}
header{position:sticky;top:0;z-index:2;padding:18px 24px;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid #302c25}
h1{font-size:20px;margin:0 0 4px}.note{margin:0;color:var(--muted)}main{padding:24px;display:grid;gap:26px}
.sheet{background:var(--card);border:1px solid #302c25;border-radius:16px;overflow:hidden;box-shadow:0 14px 40px #0005}
.meta{display:flex;justify-content:space-between;padding:10px 14px;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.meta span:first-child{color:var(--accent);font-weight:750}
img{display:block;width:100%;height:auto;background:#efe9da}@media(max-width:700px){header,main{padding:14px}main{gap:14px}.sheet{border-radius:10px}}
</style>
</head>
<body>
<header><h1>Вебинар Даши: визуальная лента</h1><p class="note">11 контакт-листов · кадр каждые 30 секунд · таймкод нанесён на каждый кадр</p></header>
<main>${cards}</main>
</body>
</html>`;

await writeFile(outputPath, html);
console.log(JSON.stringify({ outputPath, sheets: images.length, bytes: html.length }));
