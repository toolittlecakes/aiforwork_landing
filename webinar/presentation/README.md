# Актуальная презентация

## Файлы

- [`index.html`](./index.html) — редактируемый source of truth, 40 слайдов.
- [`fonts/`](./fonts/) — локальные Inter и JetBrains Mono; презентация не зависит от интернета во время эфира.
- [`webinar-ai-for-work.pdf`](./webinar-ai-for-work.pdf) — текущий PDF, 40 страниц, 16:9.
- [`contact-sheet-40.png`](./contact-sheet-40.png) — обзор всей презентации.
- [`rendered-40/`](./rendered-40/) — полноразмерные PNG текущих 40 слайдов; локальный производный артефакт, исключён из Git.

## Управление

В браузере работают стрелки, Page Up/Page Down, Space, Home и End. Текущий номер хранится в URL как `#slide=N`.

## Публикация

```bash
npx -y surge webinar/presentation aiforwork-webinar.surge.sh
```

После публикации проверить:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://aiforwork-webinar.surge.sh/
```

## Незакрытые placeholders

- `[ВСТАВИТЬ РЕАЛЬНЫЙ АРТЕФАКТ УЧАСТНИКА]`
- `[ВСТАВИТЬ РЕАЛЬНЫЙ SKILL/СКРИНШОТ]`
- `[ДЕТАЛИ ФОРМАТА НЕДЕЛЬ/МОДУЛЕЙ]`
- `[ДАТА]`, `[МЕСТА]`, `[ЦЕНА]`, `[ССЫЛКА/QR]`

Перед эфиром placeholders нужно заменить, после чего заново экспортировать PDF и contact sheet и обновить Surge.
