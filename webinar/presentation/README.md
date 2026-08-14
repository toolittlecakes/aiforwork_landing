# Актуальная презентация

## Файлы

- [`index.html`](./index.html) — редактируемый source of truth, 42 слайда.
- [`fonts/`](./fonts/) — локальные Inter и JetBrains Mono; презентация не зависит от интернета во время эфира.
- [`webinar-ai-for-work.pdf`](./webinar-ai-for-work.pdf) — текущий PDF, 42 страницы, 16:9.
- [`contact-sheet-42.png`](./contact-sheet-42.png) — обзор всей презентации.
- [`rendered-42/`](./rendered-42/) — полноразмерные PNG текущих 42 слайдов; локальный производный артефакт, исключён из Git.

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

Условия оффера синхронизированы с лендингом: старт 1 сентября, 15 000 ₽ для первых 10 мест, 18 000 ₽ до 19 августа, затем 25 000 ₽.
