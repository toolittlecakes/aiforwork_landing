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

После push в `main` workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) собирает безопасный публичный артефакт через [`scripts/build-pages.sh`](../../scripts/build-pages.sh). В него попадают основной лендинг и файлы презентации, но не feedback, транскрипты, inputs и другие исследовательские материалы из `webinar/`.

После публикации проверить:

```bash
curl -sSL -o /dev/null -w '%{http_code}\n' https://aiforwork.courses/webinar/
```

Условия оффера: старт 1 сентября, 19 000 ₽ до вечера 19 августа, затем 25 000 ₽. QR-код на офферном слайде ведёт на `https://telegram.me/aiforwork_courses_bot?start=efir_18_08_discount_19000`.
