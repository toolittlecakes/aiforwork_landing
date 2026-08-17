# Актуальная презентация

## Файлы

- [`index.html`](./index.html) — редактируемый source of truth, 36 слайдов.
- [`assets/kolya.jpg`](./assets/kolya.jpg) — локальная фотография для слайда об авторе.
- [`fonts/`](./fonts/) — локальные Inter и JetBrains Mono; презентация не зависит от интернета во время эфира.
- [`webinar-ai-for-work.pdf`](./webinar-ai-for-work.pdf) — текущий PDF, 36 страниц, 16:9.
- [`contact-sheet-36.png`](./contact-sheet-36.png) — обзор всей презентации.
- [`rendered-36/`](./rendered-36/) — полноразмерные PNG текущих 36 слайдов; локальный производный артефакт, исключён из Git.

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

Условия оффера синхронизированы с лендингом: старт 1 сентября, 18 000 ₽ до вечера 19 августа, затем 25 000 ₽. Единый CTA на офферных слайдах — «Зафиксировать цену» на `aiforwork.courses`.
