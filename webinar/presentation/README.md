# Актуальная презентация

## Файлы

- [`index.html`](./index.html) — редактируемый source of truth, 41 слайд.
- [`assets/kolya.jpg`](./assets/kolya.jpg) — локальная фотография для слайда об авторе.
- [`fonts/`](./fonts/) — локальные Inter и JetBrains Mono; презентация не зависит от интернета во время эфира.
- [`webinar-ai-for-work.pdf`](./webinar-ai-for-work.pdf) — текущий PDF, 41 страница, 16:9.
- [`contact-sheet-41.png`](./contact-sheet-41.png) — обзор всей презентации.
- [`rendered-41/`](./rendered-41/) — полноразмерные PNG текущего 41 слайда; локальный производный артефакт, исключён из Git.

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
