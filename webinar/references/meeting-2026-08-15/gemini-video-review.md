# Рекомендации из видеопрогона вебинара

Источник: полная запись 15 августа 2026, проанализированная через Gemini Files API моделью `gemini-3.6-flash` с частотой 1 FPS. Текущая презентация приложена отдельно и использована для проверки статуса изменений.

Всего дедуплицированных рекомендаций: 13.

## Слайды

### 4. Slide 3: До какого уровня вы уже дошли?

**Приоритет:** высокий. **Статус:** уже реализовано. **Источник:** сильный вывод из обсуждения. **Уверенность:** high. **Таймкод:** 00:06:21–00:12:12 (both).

**Что обсуждали.** Nikolay and Sasha noted that asking users to pick multiple numbers created confusion when compared against the self-diagnostic slide later.

**Что сейчас.** Slide 3 presents 6 numbered levels with a single clear instruction: Send the maximum number you have done.

**Что сделать.** Use 6 numbered levels and instruct viewers to submit a single maximum number representing their highest level achieved.

**Готовая формулировка / структура.** До какого уровня вы уже дошли? Отправьте в чат максимальную цифру, про которую уверенно можете сказать 'делал'.

**Зачем.** Single-number entry reduces cognitive load and allows the host to instantly gauge audience distribution in chat.

## Структура и драматургия

### 3. Slide 2: За четыре года чат превратился в рабочую среду

**Приоритет:** высокий. **Статус:** уже реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:05:25–00:06:21 (Sasha).

**Что обсуждали.** Sasha suggested reordering the opening interactive slides so audience poll questions do not create dead air while waiting for chat responses.

**Что сейчас.** The tech check / city poll was removed from the main slide sequence and integrated smoothly before the AI evolution timeline.

**Что сделать.** Ask interactive chat questions right before presenting a narrative timeline so the audience types while the presenter speaks.

**Готовая формулировка / структура.** Prompt chat question -> Transition to AI evolution timeline (Slide 2) -> Read chat answers after finishing Slide 2.

**Зачем.** Eliminates awkward pauses caused by stream latency and delayed chat responses.

### 7. Slide 14: Раньше — текст в чате. Теперь — готовый файл

**Приоритет:** средний. **Статус:** уже реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:34:25–00:38:00 (Sasha).

**Что обсуждали.** Sasha noted that Slide 14 ('Before text in chat, now ready file') felt repetitive and slowed pacing between task setup and practical exercises.

**Что сейчас.** Slide 14 is streamlined with clear contrast boxes ('Ответ в чате' vs 'Рабочий артефакт') and fast transition to Slide 15.

**Что сделать.** Keep Slide 14 as a quick 20-second visual transition emphasizing 'file artifact vs chat text' without lengthy narration.

**Готовая формулировка / структура.** Highlight contrast: 'Раньше — текст в чате. Теперь — готовый файл в рабочей папке'.

**Зачем.** Maintains energy and moves quickly into the actionable 5-question framework.

### 8. Slide 18: Три способа поправить агента, не начиная заново

**Приоритет:** высокий. **Статус:** уже реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:38:00–00:45:35 (Sasha).

**Что обсуждали.** Nikolay demonstrated built-in browser annotations at length. Sasha warned that over-explaining 'Edit, Reply, Queue' features felt like a separate technical lecture.

**Что сейчас.** Slide 18 condenses Edit, Reply, Queue into a clean 3-column card format with explicit completion criteria.

**Что сделать.** Summarize the 3 feedback methods in under 90 seconds, focusing on when to stop building prompt towers.

**Готовая формулировка / структура.** Edit (rewrite if completely wrong), Reply (steer in progress), Queue (plan next step). Rule: 'Если направление неверно — перепишите, а не стройте башню'.

**Зачем.** Prevents cognitive overload and keeps focus on high-level operational habits.

### 12. Slide 39: Вопросы про ваш маршрут и марафон

**Приоритет:** средний. **Статус:** не реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 01:35:30–01:41:00 (Sasha).

**Что обсуждали.** Sasha suggested showing real custom instructions (`AGENTS.md`) or a student's skill example during the post-pitch Q&A section to keep engaged participants on the stream.

**Что сейчас.** Slide 39 is a static Q&A slide with price blocks.

**Что сделать.** During Q&A, switch screens to show Nikolay's actual `AGENTS.md` file or a student's working skill to demonstrate real-world artifact quality.

**Готовая формулировка / структура.** Transition phrase: 'Пока вы пишите вопросы в чат, покажу, как выглядит готовый системный промпт изнутри'.

**Зачем.** Demonstrating tangible technical artifacts during Q&A proves product value and retains viewers through the pitch end.

## Оффер, срочность и CTA

### 11. Slide 37: Старт — 1 сентября

**Приоритет:** критический. **Статус:** уже реализовано. **Источник:** решение/сомнение Николая. **Уверенность:** high. **Таймкод:** 01:31:20–01:35:20 (both).

**Что обсуждали.** Nikolay and Sasha discussed price tiers (15k vs 18k vs 25k). Nikolay decided to simplify the live webinar offer to 10 seats at 18,000 RUB using a special stream promo code.

**Что сейчас.** Slide 37 and 39 show: First 10 seats 15,000 RUB (early bird), then 18,000 RUB until Aug 19, then 25,000 RUB.

**Что сделать.** Align live verbal presentation with the landing page offer: announce 18,000 RUB price for stream viewers with a promo code for the first 10 spots.

**Готовая формулировка / структура.** Verbal offer: 'Для участников эфира цена 18 000 ₽ на первые 10 мест по промокоду из бота. После 10 мест или с 19 августа — 25 000 ₽'.

**Зачем.** Eliminates confusion between multiple pricing tiers and creates genuine live stream urgency.

## Что и как говорить

### 1. not slide-specific

**Приоритет:** высокий. **Статус:** уже реализовано. **Источник:** решение/сомнение Николая. **Уверенность:** high. **Таймкод:** 00:00:00–00:04:50 (both).

**Что обсуждали.** Sasha and Nikolay discussed co-hosting roles. Sasha proposed acting as chatter/moderator or doing an interview/exam format as a non-tech user. Nikolay decided they should co-host with Sasha introducing the session, setting expectations, and moderating chat while Nikolay leads the core content.

**Что сейчас.** The current deck and webinar structure position Sasha as co-host and chatter, while Nikolay leads the presentation content.

**Что сделать.** Maintain clear role division: Sasha opens the stream, manages chat engagement, and prompts Nikolay with questions, while Nikolay presents the roadmap steps.

**Готовая формулировка / структура.** Sasha opens with greetings and chat moderation rules; Nikolay steps in to lead the slide walkthrough and technical explanations.

**Зачем.** Clear division of roles prevents verbal overlap, maintains energy, and ensures moderation does not distract from technical delivery.

### 2. Slide 1: Как вкатиться в ИИ-агентов

**Приоритет:** средний. **Статус:** не реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:04:50–00:05:25 (Sasha).

**Что обсуждали.** Sasha rehearsed an introductory greeting on the title slide. Nikolay stopped her, noting that holding on a static title screen for too long without visual movement slows down pacing.

**Что сейчас.** The title slide remains a static opening screen.

**Что сделать.** Keep the title slide intro under 60 seconds and transition quickly to interactive check-in slides.

**Готовая формулировка / структура.** Greeting (30s) -> Brief expectation setting (30s) -> Switch to Tech Check / Check-in slide.

**Зачем.** Fast visual transition early in the broadcast retains viewer attention and prevents early drop-off.

### 6. Slide 13: Задача 1: настроить Codex под себя

**Приоритет:** высокий. **Статус:** не реализовано. **Источник:** решение/сомнение Николая. **Уверенность:** high. **Таймкод:** 00:29:36–00:34:25 (Nikolay).

**Что обсуждали.** Nikolay demonstrated the Hold-to-Dictate / Hotkey feature in ChatGPT/Codex settings and explained 'rambling/barmatanie' as a key dictation technique.

**Что сейчас.** Slide 13 lists 'Голосовой ввод и горячую клавишу' in text.

**Что сделать.** Show the dictation settings screen briefly in live demo and explain that dictating unpolished thoughts gives agents 3x more detail than typing manually.

**Готовая формулировка / структура.** Verbal instruction: 'Не пытайтесь сразу формулировать идеально. Наговорите всё как есть голосом через хоткей — агент вытащит детали сам'.

**Зачем.** Dictation lowers the barrier for non-coders and produces richer context for agent prompts.

### 9. Slide 23: Если плагина нет: API или MCP

**Приоритет:** высокий. **Статус:** не реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:55:00–01:00:45 (Sasha).

**Что обсуждали.** Nikolay spent over 5 minutes explaining API using an extended MFC passport office analogy. Sasha noted this explanation became overly technical and confusing for non-coders.

**Что сейчас.** Slide 23 presents API and MCP with simple summaries and concrete logos (hh.ru, Telegram-bot, Yandex.Metrika).

**Что сделать.** Simplify the API explanation to 45 seconds: call API a 'service door' and emphasize key security ('never paste keys into chat').

**Готовая формулировка / структура.** Verbal copy: 'API — это служебный вход. Вам не надо кодить интеграцию: создаёте ключ, сохраняете в файл, и Codex всё делает сам'.

**Зачем.** Non-technical viewers tune out during complex technical analogies; security rules provide actionable value without confusion.

### 10. Slide 30: Автоматизация — skill, который запускается сам

**Приоритет:** высокий. **Статус:** не реализовано. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 01:06:40–01:18:00 (Sasha).

**Что обсуждали.** Sasha gave strong feedback that Nikolay sounded tired towards the end, shifting into vague inspirational 'infocigan' talk about future possibilities rather than concrete practical steps.

**Что сейчас.** Slide 30 lists concrete triggers: By timer, In cloud, As mentor.

**Что сделать.** Deliver the automation and skills section crisply using real operational examples (weekly retro, competitor scraping) instead of abstract future visions.

**Готовая формулировка / структура.** Focus delivery on: 'Автоматизация — это сэкономленные 2 часа каждую неделю на регулярных отчётах без вашего участия'.

**Зачем.** Grounded business examples maintain credibility and trust, preventing sales resistance.

### 13. not slide-specific

**Приоритет:** средний. **Статус:** не реализовано. **Источник:** сильный вывод из обсуждения. **Уверенность:** high. **Таймкод:** 01:48:20–01:55:31 (both).

**Что обсуждали.** In the final debrief, Sasha and Nikolay agreed on moderation rules for Q&A: Sasha will filter out overly technical, nerdy questions (e.g. agent orchestration frameworks, Qwen 3.8 models) so the broadcast stays focused on practical business automation.

**Что сейчас.** Q&A slide expects general questions.

**Что сделать.** Sasha actively filters chat questions, reading aloud only those relevant to non-technical business users and postponing deep developer questions.

**Готовая формулировка / структура.** Sasha verbal filter: 'Вопросы про сложную разработку мы разберём отдельно в сообществе, а сейчас ответим на вопросы про внедрение в рабочие задачи'.

**Зачем.** Keeps the webinar accessible and relevant for the target non-coder audience, preventing technical derailment.

## Организация эфира

### 5. Slide 11: Шаг 0: добиться, чтобы Codex просто запустился

**Приоритет:** средний. **Статус:** реализовано частично. **Источник:** явное замечание Саши. **Уверенность:** high. **Таймкод:** 00:25:20–00:29:36 (Sasha).

**Что обсуждали.** During the discussion of Step 0 (VPN and Windows setup), Sasha pointed out that explicitly recommending specific VPN services on stream could trigger platform moderation risks.

**Что сейчас.** Slide 11 lists general requirements ('Рабочий VPN и аккаунт') without naming specific VPN providers on screen.

**Что сделать.** Do not list or state specific commercial VPN names verbally or on slides; direct users to the Telegram bot guide instead.

**Готовая формулировка / структура.** Slide copy: 'Рабочий VPN и аккаунт'. Delivery note: 'Подробную инструкцию по настройке вышлем в боте после эфира'.

**Зачем.** Prevents YouTube/Zoom stream bans or compliance flags regarding restricted software recommendations.

## Сквозные наблюдения

- The review conversation took place on August 15, 2026. Several visual slide edits requested during the call (such as consolidating the self-diagnostic checklist to 9 items, adding Step 0, and reordering slides) were implemented in the deck immediately after the call.

- Delivery and moderation instructions (such as simplified API analogies, avoiding specific VPN names, and Q&A question filtering) remain active guidelines for the live webinar.

## Неопределённости

- The exact promo code name for the 18,000 RUB live offer was discussed as generated dynamically by the Telegram bot and is not hardcoded on the slides.
