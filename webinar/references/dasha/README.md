# Референс: вебинар Даши

Исходное видео: <https://www.youtube.com/watch?v=f2yzcsByUUU>, длительность 2:17:18. Рабочий архив лежит в [`source/`](./source/).

## Главное

- [`source/transcript.md`](./source/transcript.md) — удобный нормализованный транскрипт, собранный из YouTube Russian Original auto-captions и сгруппированный примерно в 30-секундные интервалы.
- [`source/slides/`](./source/slides/) — 154 полноразмерных кадра 1920×1080, source of truth по физическим состояниям презентации.
- [`source/synthesis.md`](./source/synthesis.md) — итоговый reverse engineering: макроструктура, conceptual slides, продающие механики, сильные и слабые места, сравнение Fable и GPT‑5.6.
- [`gallery.html`](./gallery.html) — автономная HTML-лента 11 контактных листов с таймкодами.
- [`source/contact-sheets-30s/`](./source/contact-sheets-30s/) — 11 JPEG-контактных листов, кадр каждые 30 секунд.

## Сырые источники

- `source/source.mp4` — скачанное исходное видео, около 394 MB.
- [`source/youtube-transcript.ru-orig.vtt`](./source/youtube-transcript.ru-orig.vtt) — оригинальные YouTube-субтитры VTT.
- [`source/youtube-transcript.ru-orig.json3`](./source/youtube-transcript.ru-orig.json3) — оригинальные YouTube-субтитры JSON3.
- [`source/source.info.json`](./source/source.info.json) — метаданные yt-dlp.

## Детектирование и проверка смен слайдов

- [`source/scene-detection/`](./source/scene-detection/) — 154 кадра локального детектора смен.
- [`source/analysis.json`](./source/analysis.json) — карта экранов, построенная мультимодальной моделью.
- [`source/scene-map-comparison.json`](./source/scene-map-comparison.json) — сравнение локального детектора и модельной карты.
- [`source/scene-test-10m/`](./source/scene-test-10m/) — тестовые кадры настройки детектора на первых десяти минутах.
- [`source/gemini-upload.json`](./source/gemini-upload.json) и [`source/gemini-response-metadata.json`](./source/gemini-response-metadata.json) — технические метаданные анализа.

## Скрипты воспроизведения пайплайна

- [`source/normalize_transcript.ts`](./source/normalize_transcript.ts) — нормализация YouTube-транскрипта.
- [`source/analyze_video.ts`](./source/analyze_video.ts) — мультимодальный анализ видео.
- [`source/extract_slides.ts`](./source/extract_slides.ts) — извлечение кадров слайдов.
- [`source/compare_scene_maps.ts`](./source/compare_scene_maps.ts) — сравнение карт переходов.
- [`source/build_gallery.ts`](./source/build_gallery.ts) — сборка визуальной галереи.

## Важное про финал референса

С 01:55:47 до последнего кадра остаётся pricing-слайд «Специальное предложение». Собака появляется только в маленьком webcam-окне; отдельного full-camera переключения нет.
