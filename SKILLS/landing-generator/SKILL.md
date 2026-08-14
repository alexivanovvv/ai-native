---
name: landing-generator
description: Создаёт лендинг в тёмном минималистичном стиле с зелёными акцентами на основе MD-файла с содержанием. Используй когда пользователь говорит "создай лендинг", "сделай landing page", "нужна посадочная страница", или вызывает /landing-generator с путём к MD-файлу.
allowed-tools: Read, Bash, Write, Edit
user-invocable: true
---

# Landing Page Generator

Преобразует MD-файл с контентом в однофайловый HTML-лендинг в стиле AI Native (тёмный минимализм, зелёные акценты, вдохновлён Linear/Vercel/Stripe).

**Вход:** `path/to/content.md`
**Выход:** `path/to/<slug>-landing.html` (рядом с MD)

---

## Шаг 1. Прочитай MD-файл

Пользователь даёт путь к MD-файлу. Прочитай его целиком. Если путь не передан — спроси.

---

## Шаг 2. Распарси контент по секциям

Скилл распознаёт следующие секции (через заголовки `#` / `##`). Сопоставление **«MD-маркер → HTML-секция»**:

| MD-маркер | HTML-секция | Обязательная? |
|---|---|---|
| Первый параграф до `---` или первого `#` | `hero` (заголовок + подзаголовок) | да |
| Ссылка на youtube/youtu.be в верхней части | `video` (clickable cover) | нет |
| `> ` блок в верхней части | `hero-subtitle` (или `hero-callout`) | нет |
| `# Три уровня …` или `# Levels …` | `levels` (3 карточки с подсветкой) | нет |
| `# Для кого` / `# Audience` | `audience` (карточки с нумерацией) | нет |
| `# Что даёт …` / `# Solution` / `# Что внутри` | `solution` (features-grid) | нет |
| `# Ведущий` / `# Автор` / `# Instructor` | `instructor` (текст + статистика) | нет |
| `# Отзывы` / `# Testimonials` | `testimonials` (карточки с цитатами) | нет |
| `# Программа` + `#### Неделя N:` подзаголовки | `curriculum` (4 weekly cards) | нет |
| `# Тарифы` / `# Условия и цены` / `# Pricing` + `#### …` подзаголовки | `pricing` (карточки с ценами) | нет |
| `## Записаться` / `## Оплата` | `enroll` (4 карточки способов оплаты) | нет |
| `# FAQ` + список `- **вопрос?**` + ответ-параграф | `faq` (accordion) | нет |
| `> …` блок в самом конце (юр. реквизиты) | `footer` (легальный блок) | нет |

**Жёсткие правила:**
- Заголовки секций (`# …`) → переводятся в `<h2>` с `section-label` сверху.
- `#### Неделя N: Название` → карточка недели в curriculum.
- `#### Название тарифа` + строка с `**€XXX**` (опц. `~~€YYY~~`) + список → карточка тарифа.
- Цитата в формате:
  ```
  > **«Короткий хедер»**
  > Тело цитаты, несколько предложений.
  > — *Имя, роль*
  ```
  → testimonial-карточка.
- В FAQ: `- **Вопрос?**` + 4-пробельный отступ для ответа → пара вопрос/ответ.

Если каких-то секций нет — просто пропусти их в HTML.

---

## Шаг 3. Собери HTML

**Структура файла:**

```
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{Title из первого параграфа MD}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>{{CSS из шаблона ниже}}</style>
</head>
<body>
    <nav>...</nav>
    <section class="hero">...</section>
    <section class="video">...</section>      опц.
    <section class="problem">...</section>    опц. (levels)
    <section class="solution">...</section>   опц.
    <section class="audience">...</section>   опц.
    <section class="curriculum">...</section> опц.
    <section class="testimonials">...</section> опц.
    <section class="program">...</section>    опц. (pricing)
    <section class="enroll">...</section>     опц.
    <section class="instructor">...</section> опц.
    <section class="faq">...</section>        опц.
    <section class="cta">...</section>
    <footer>...</footer>
    <script>{{JS из шаблона}}</script>
</body>
</html>
```

**Порядок секций** — фиксированный (как выше). Пропусти те, для которых нет данных в MD.

---

## Дизайн-система (обязательная)

### Цвета

```css
--bg: #000000;
--bg-elevated: #0a0a0b;
--bg-card: #111113;
--fg: #ffffff;
--fg-muted: #8a8a8e;
--fg-dim: #5a5a5e;
--accent: #22c55e;          /* зелёный — фирменный */
--accent-light: #4ade80;
--accent-glow: rgba(34, 197, 94, 0.4);
--border: #1f1f23;
--border-subtle: #18181b;
--gradient-primary: linear-gradient(135deg, #10b981 0%, #22c55e 50%, #84cc16 100%);
--gradient-glow: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.25), transparent);
```

### Типографика

- Шрифт: **Inter** (Google Fonts)
- Базовый размер: 18px
- Hero h1: `clamp(48px, 8vw, 80px)`, font-weight 800, letter-spacing -0.04em
- h2: `clamp(32px, 5vw, 48px)`, font-weight 700, letter-spacing -0.03em
- Тело: 16-18px, line-height 1.5-1.7
- Section-label: 14px, uppercase, letter-spacing 0.1em, accent-light

### Геометрия

- Container: `max-width: 1200px; padding: 0 24px;`
- Секция: `padding: 120px 0; border-top: 1px solid var(--border-subtle);`
- Карточки: `border-radius: 16-24px; padding: 32-40px;`
- Hover карточки: `border-color: var(--accent); transform: translateY(-4px);`

### Hero-эффекты (обязательно)

- Градиентное свечение сверху (`hero::before` с `--gradient-glow`)
- Сетка на фоне (`linear-gradient` 64x64px, opacity 0.02, маскированная радиальным градиентом)
- Анимация `fadeInUp` для заголовка/подзаголовка/CTA
- Badge с пульсирующей зелёной точкой

### Видео-секция (важно!)

**НЕ использовать `<iframe>`** — многие YouTube-видео блокируют embed (ошибка 153). Вместо этого:

```html
<a href="https://youtu.be/{ID}" target="_blank" class="demo-window">
  <div class="demo-header">
    <div class="demo-dot"></div><div class="demo-dot"></div><div class="demo-dot"></div>
  </div>
  <div style="position: relative; padding-bottom: 56.25%;">
    <img src="https://img.youtube.com/vi/{ID}/maxresdefault.jpg" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.85;">
    <div class="play-button">▶</div>
    <div class="play-label">Смотреть на YouTube →</div>
  </div>
</a>
```

Открывает видео на YouTube в новой вкладке через клик.

### Карточка отзыва

```html
<div class="testimonial-card">
  <div class="testimonial-quote">«Короткий хедер»</div>
  <p class="testimonial-body">Тело цитаты…</p>
  <div class="testimonial-author">— Имя, роль</div>
</div>
```

Стиль: фон `bg-card`, border-radius 20px, кавычка-хедер крупная (24px, gradient-text), тело muted, автор зелёный.

### Карточка недели (curriculum)

4 карточки в grid 2x2 (или 4x1 на десктопе):

```html
<div class="feature-card">
  <div class="feature-icon">{N}</div>
  <h3>Неделя {N} · {Глагол}</h3>
  <p>{Описание + bullets}</p>
</div>
```

Иконка — цифра 1/2/3/4 в зелёном квадрате.

### Карточка тарифа

```html
<div class="program-card [featured]">
  <div class="program-badge">{Тип}</div>
  <h3 class="program-title">{Название}</h3>
  <p class="program-duration">{Срок · сессии}</p>
  <div class="program-price">
    <span class="program-currency">€</span>
    <span class="program-amount">{N}</span>
    <span class="program-approx"><s>€{old}</s> · {примечание}</span>
  </div>
  <ul class="program-features">…</ul>
  <a href="#enroll" class="btn btn-primary program-cta">Записаться</a>
</div>
```

Тариф с пометкой "популярный" получает класс `featured` (зелёный border + плашка).

### FAQ accordion

- Список вопросов с `+` справа, при клике превращается в `×` (rotate 45deg)
- Ответ раскрывается через `max-height` transition
- При открытии одного — остальные закрываются

### Footer

Юр. реквизиты (ИНН, email, ссылки на Telegram/сайт) + копирайт.

---

## AI Native — эталонный пример

Источник: `~/Library/CloudStorage/Dropbox/_Obsidian/Alex Ivanov MAIN Vault/PROJECTS/13 AI NATIVE/04 Лендинг/index.html`

**Особенности этого лендинга, которые надо воспроизводить:**

1. **Hero с датой старта** — badge "Старт потока — {дата}" с пульсирующей зелёной точкой. h1 в 2 строки, вторая строка градиентная.

2. **Видео сразу после hero** — clickable cover (НЕ iframe). Использует thumbnail с `img.youtube.com/vi/{ID}/maxresdefault.jpg`.

3. **«Три уровня»** — 3 карточки в одну колонку (problem-grid), третья с классом `.active` (зелёная подсветка, gradient-номер). Демонстрирует движение от состояния A к состоянию B.

4. **Аудитория без бойлерплейта** — карточки сегментов с большой gradient-цифрой 01-06 и кратким описанием. Внизу — мотивирующий callout с зелёным фоном.

5. **Программа по неделям, без Level 1/Level 2** — 4 карточки (по неделям) в features-grid. Каждая: цифра 1-4, "Неделя N · Глагол" (Организуй / Настрой / Свяжи / Запусти), краткое описание + bullets. Под ними — общий callout «Что заберёте за 4 недели».

6. **Формат интенсива** — extras-grid из 4 карточек с эмодзи: 📅 8 воркшопов · 🤝 бадди · ❓ Q&A · 💬 Чат.

7. **Отзывы участников** — карточки с цитатами из реального транскрипта. У каждой: хедер в кавычках, тело, подпись "— Имя, роль". Берутся из транскрипта последней сессии курса.

8. **Тарифы 2 шт + менторинг** — две `program-card` (персональное / от компании). Под ними отдельным callout-блоком: "+€300 — менторинг-поддержка". Скидка через `<s>€750</s>`.

9. **Способы оплаты — 4 карточки** — отдельная секция `#enroll` сразу после тарифов: $/€ (talkauthentic), ₽ (derzhites), USDT (Telegram), счёт компании (Telegram). Каждая — кликабельная карточка с иконкой 💳/🪙/🧾.

10. **Ведущий — лаконично** — 2-3 абзаца + 3 цифры (выпускники / оценка / подписчики).

11. **FAQ — 9 вопросов** — все основные возражения покрыты: "чем отличается", "оплата аккаунтов", "встречи", "опыт программирования", "инструменты", "формат", "записи", "время в неделю", "уже использую AI".

12. **Юр. подвал** — ФИО + ИНН + email отдельным блоком.

**Тон копирайта:** прямой, без воды. Заголовки 4-7 слов. В bullets — конкретика (имена инструментов, цифры, сроки). Без «прорывов» и «революций».

**Что нельзя:**
- Использовать `<iframe>` для YouTube (ошибка 153)
- Делать Level 1 / Level 2 / Tier 1 — недели нумеровать просто цифрами
- Stock-photo / 3D-illustrations — только цвет, типографика и эмодзи
- Светлый фон где угодно
- Любой цвет кроме зелёного как акцент

---

## Полный CSS-шаблон

<css-template>
```css
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
    --bg: #000000;
    --bg-elevated: #0a0a0b;
    --bg-card: #111113;
    --fg: #ffffff;
    --fg-muted: #8a8a8e;
    --fg-dim: #5a5a5e;
    --accent: #22c55e;
    --accent-light: #4ade80;
    --border: #1f1f23;
    --border-subtle: #18181b;
    --gradient-primary: linear-gradient(135deg, #10b981 0%, #22c55e 50%, #84cc16 100%);
    --gradient-glow: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.25), transparent);
}

html { scroll-behavior: smooth; }

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--fg);
    line-height: 1.5;
    font-size: 18px;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
}

::selection { background: var(--accent); color: white; }

.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* Nav */
nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
}
nav .container { display: flex; justify-content: space-between; align-items: center; height: 72px; }
.logo { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; color: var(--fg); text-decoration: none; }
.logo-icon { width: 32px; height: 32px; background: var(--gradient-primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.nav-links { display: flex; gap: 40px; list-style: none; }
.nav-links a { color: var(--fg-muted); text-decoration: none; font-size: 16px; font-weight: 500; transition: color 0.2s; }
.nav-links a:hover { color: var(--fg); }

/* Buttons */
.btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 28px; border-radius: 10px; font-size: 16px; font-weight: 600;
    text-decoration: none; transition: all 0.2s ease; cursor: pointer; border: none;
    letter-spacing: -0.01em;
}
.btn-primary {
    background: var(--gradient-primary); color: white;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 16px rgba(34, 197, 94, 0.3);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(255,255,255,0.2) inset, 0 8px 24px rgba(34, 197, 94, 0.4); }
.btn-secondary { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-secondary:hover { border-color: var(--fg-muted); background: rgba(255,255,255,0.03); }

/* Hero */
.hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 120px 0 80px; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; height: 100%; background: var(--gradient-glow); pointer-events: none; }
.hero-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent); -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent); }
.hero .container { position: relative; z-index: 1; }
.hero-label { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px 8px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 100px; font-size: 15px; color: var(--fg-muted); margin-bottom: 32px; animation: fadeInUp 0.8s ease; }
.hero-label-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: pulse 2s ease infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

h1 { font-size: clamp(48px, 8vw, 80px); font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin-bottom: 24px; max-width: 900px; animation: fadeInUp 0.8s ease 0.1s both; }
.hero-gradient-text { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-subtitle { font-size: clamp(18px, 2.5vw, 24px); color: var(--fg-muted); max-width: 640px; margin-bottom: 48px; line-height: 1.6; animation: fadeInUp 0.8s ease 0.2s both; }
.hero-cta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 80px; animation: fadeInUp 0.8s ease 0.3s both; }
.hero-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 48px; padding-top: 48px; border-top: 1px solid var(--border-subtle); max-width: 600px; animation: fadeInUp 0.8s ease 0.4s both; }
.hero-stat-number { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.hero-stat-label { font-size: 15px; color: var(--fg-dim); }

/* Section headers */
.section-header { text-align: center; margin-bottom: 64px; }
.section-label { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-light); margin-bottom: 16px; font-weight: 600; }
h2 { font-size: clamp(32px, 5vw, 48px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; max-width: 700px; }
.section-header h2 { margin: 0 auto; }
section { position: relative; }

/* Levels (problem) */
.problem { padding: 120px 0; border-top: 1px solid var(--border-subtle); background: linear-gradient(180deg, transparent 0%, var(--bg-elevated) 100%); }
.problem-grid { display: grid; gap: 16px; max-width: 800px; margin: 0 auto; }
.level-card { display: grid; grid-template-columns: 80px 1fr; gap: 24px; padding: 32px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; transition: all 0.4s ease; }
.level-card.active { border-color: var(--accent); background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--bg-card) 100%); }
.level-number { font-size: 48px; font-weight: 800; color: var(--fg-dim); opacity: 0.3; line-height: 1; }
.level-card.active .level-number { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 1; }
.level-content h3 { font-size: 24px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.02em; }
.level-content p { color: var(--fg-muted); font-size: 17px; }
.level-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 4px 12px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: var(--accent-light); border-radius: 100px; font-size: 12px; font-weight: 600; }

/* Features (solution / curriculum weeks) */
.solution { padding: 120px 0; border-top: 1px solid var(--border-subtle); }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.feature-card { padding: 32px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; transition: all 0.3s ease; }
.feature-card:hover { border-color: var(--border); transform: translateY(-4px); }
.feature-card.featured { grid-column: span 2; background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, var(--bg-card) 100%); border-color: rgba(34, 197, 94, 0.2); }
.feature-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--gradient-primary); border-radius: 12px; margin-bottom: 20px; font-size: 24px; color: white; font-weight: 700; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.25); }
.feature-card h3 { font-size: 20px; font-weight: 600; margin-bottom: 12px; letter-spacing: -0.02em; }
.feature-card p { color: var(--fg-muted); font-size: 16px; line-height: 1.6; }

/* Video / demo */
.demo { padding: 80px 0 120px; border-top: 1px solid var(--border-subtle); }
.demo-window { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5); display: block; text-decoration: none; color: inherit; }
.demo-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
.demo-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--fg-dim); }
.demo-dot:first-child { background: #ef4444; }
.demo-dot:nth-child(2) { background: #eab308; }
.demo-dot:nth-child(3) { background: #22c55e; }
.play-button { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 88px; height: 88px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(34, 197, 94, 0.5); font-size: 32px; color: #fff; }
.play-label { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 8px 18px; background: rgba(0, 0, 0, 0.7); border-radius: 100px; font-size: 14px; color: #fff; }

/* Curriculum extras (формат) */
.curriculum { padding: 120px 0; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
.curriculum-result { margin-top: 32px; padding: 20px 24px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; font-size: 16px; color: var(--fg-muted); }
.curriculum-result strong { color: var(--fg); }
.curriculum-extras { text-align: center; padding-top: 48px; border-top: 1px solid var(--border-subtle); margin-top: 48px; }
.extras-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.extra { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; transition: all 0.3s ease; text-decoration: none; color: inherit; }
.extra:hover { border-color: var(--accent); transform: translateY(-4px); }
.extra-icon { font-size: 40px; margin-bottom: 16px; }
.extra-content h4 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.extra-content p { color: var(--fg-muted); font-size: 15px; }

/* Audience */
.audience { padding: 120px 0; border-top: 1px solid var(--border-subtle); }
.audience-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 48px; }
.audience-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 32px; transition: all 0.3s ease; position: relative; overflow: hidden; }
.audience-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient-primary); opacity: 0; transition: opacity 0.3s ease; }
.audience-card:hover { border-color: var(--border); transform: translateY(-4px); }
.audience-card:hover::before { opacity: 1; }
.audience-number { font-size: 48px; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 16px; opacity: 0.6; }
.audience-card h3 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
.audience-card p { color: var(--fg-muted); font-size: 16px; line-height: 1.6; }
.audience-motivation { text-align: center; padding: 32px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 16px; }
.audience-motivation p { font-size: 20px; color: var(--fg); margin: 0; }
.audience-motivation strong { color: var(--accent-light); }

/* Testimonials */
.testimonials { padding: 120px 0; border-top: 1px solid var(--border-subtle); }
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
.testimonial-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 32px; transition: all 0.3s ease; }
.testimonial-card:hover { border-color: var(--accent); }
.testimonial-quote { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.3; margin-bottom: 16px; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.testimonial-body { color: var(--fg-muted); font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
.testimonial-author { color: var(--accent-light); font-size: 14px; font-weight: 500; }

/* Pricing */
.program { padding: 120px 0; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
.program-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 900px; margin: 0 auto; }
.program-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 24px; padding: 40px; position: relative; overflow: hidden; transition: all 0.3s ease; }
.program-card:hover { border-color: var(--border); transform: translateY(-4px); }
.program-card.featured { border-color: var(--accent); background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, var(--bg-card) 100%); }
.program-badge { display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.15); color: var(--accent-light); border-radius: 8px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
.program-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; }
.program-duration { color: var(--fg-muted); font-size: 16px; margin-bottom: 24px; }
.program-price { display: flex; align-items: baseline; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
.program-amount { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; }
.program-currency { font-size: 24px; font-weight: 600; color: var(--fg-muted); }
.program-approx { font-size: 16px; color: var(--fg-dim); }
.program-features { list-style: none; margin-bottom: 32px; }
.program-features li { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; font-size: 16px; color: var(--fg-muted); border-bottom: 1px solid var(--border-subtle); }
.program-features li:last-child { border-bottom: none; }
.program-features li::before { content: '✓'; color: var(--accent); font-weight: 700; }
.program-cta { width: 100%; }

/* Instructor */
.instructor { padding: 120px 0; border-top: 1px solid var(--border-subtle); }
.instructor-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: center; }
.instructor-avatar { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(132, 204, 22, 0.2) 100%); border-radius: 32px; display: flex; align-items: center; justify-content: center; font-size: 120px; border: 1px solid var(--border-subtle); }
.instructor-title { color: var(--accent-light); font-size: 17px; font-weight: 500; margin-bottom: 24px; }
.instructor-bio { color: var(--fg-muted); font-size: 18px; line-height: 1.7; margin-bottom: 24px; }
.instructor-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding-top: 32px; border-top: 1px solid var(--border-subtle); }
.instructor-stat-number { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.instructor-stat-label { font-size: 13px; color: var(--fg-dim); }

/* FAQ */
.faq { padding: 120px 0; border-top: 1px solid var(--border-subtle); background: var(--bg-elevated); }
.faq-list { max-width: 700px; margin: 0 auto; }
.faq-item { border-bottom: 1px solid var(--border-subtle); }
.faq-question { width: 100%; background: none; border: none; padding: 24px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left; color: var(--fg); font-size: 19px; font-weight: 500; }
.faq-question:hover { color: var(--accent-light); }
.faq-icon { font-size: 24px; color: var(--fg-dim); transition: all 0.3s ease; }
.faq-item.active .faq-icon { transform: rotate(45deg); color: var(--accent); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.4s ease; }
.faq-answer-content { padding-bottom: 24px; color: var(--fg-muted); font-size: 17px; line-height: 1.7; }
.faq-item.active .faq-answer { max-height: 500px; }

/* CTA */
.cta { padding: 140px 0; border-top: 1px solid var(--border-subtle); text-align: center; position: relative; overflow: hidden; }
.cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 70%); pointer-events: none; }
.cta .container { position: relative; z-index: 1; }
.cta h2 { margin: 0 auto 16px; }
.cta p { color: var(--fg-muted); font-size: 20px; max-width: 520px; margin: 0 auto 40px; }
.cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

/* Footer */
footer { padding: 48px 0; border-top: 1px solid var(--border-subtle); }
footer .container { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; }
.footer-legal { color: var(--fg-dim); font-size: 14px; line-height: 1.5; }
.footer-links { display: flex; gap: 32px; }
.footer-links a { color: var(--fg-dim); text-decoration: none; font-size: 16px; transition: color 0.2s; }
.footer-links a:hover { color: var(--fg); }

/* Mobile */
@media (max-width: 1024px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); }
    .feature-card.featured { grid-column: span 2; }
    .extras-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
    .nav-links { display: none; }
    .hero { padding: 100px 0 60px; }
    h1 { font-size: 40px; }
    .hero-stats { grid-template-columns: repeat(2, 1fr); gap: 32px; }
    .features-grid, .program-cards, .extras-grid { grid-template-columns: 1fr; }
    .feature-card.featured { grid-column: span 1; }
    .instructor-grid { grid-template-columns: 1fr; gap: 48px; }
    .instructor-avatar { max-width: 280px; margin: 0 auto; }
    .hero-cta, .cta-buttons { flex-direction: column; }
    .hero-cta .btn, .cta-buttons .btn { width: 100%; }
    footer .container { flex-direction: column; text-align: center; }
    .footer-links { flex-wrap: wrap; justify-content: center; }
    .level-card { grid-template-columns: 1fr; gap: 16px; }
    .level-number { font-size: 32px; }
}
```
</css-template>

---

## JS-шаблон (обязательно)

```html
<script>
// FAQ accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

// Intersection animation
const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
        if (en.isIntersecting) {
            en.target.style.opacity = '1';
            en.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.level-card, .feature-card, .program-card, .testimonial-card, .audience-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    io.observe(el);
});
</script>
```

---

## Чеклист перед сохранением

- [ ] Title в `<head>` берётся из первой строки MD
- [ ] `<nav>` собрана только из реально присутствующих секций
- [ ] Hero: badge с датой + h1 (2 строки, вторая градиентная) + subtitle + 2 CTA + stats
- [ ] YouTube — clickable cover, НЕ iframe
- [ ] Если есть «Три уровня» — третий с классом `.active`
- [ ] Недели программы нумеруются цифрами (1-4), НЕ "Level 1/2"
- [ ] Тарифы: `<s>€старая</s>` если есть скидка; один тариф может иметь `featured`
- [ ] FAQ: все вопросы из MD, accordion работает
- [ ] Юр. подвал собран из последнего `>` блока MD
- [ ] CSS и JS встроены в один файл
- [ ] Inter подключён через Google Fonts
- [ ] Никаких эмодзи в копирайте кроме `extras-grid` и `enroll`-карточек

---

## Имя выходного файла

`{slug-from-title-or-product-name}-landing.html` рядом с исходным MD.

После сохранения покажи путь и кратко перечисли созданные секции.
