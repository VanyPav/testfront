# REQUIREMENTS — PDT-32311: Блок вопросов на продуктовой странице (Amasty FAQ)

## Источник
- Jira: https://amasty.atlassian.net/browse/PDT-32311 (подзадача №10, split от PDT-30757)
- Контракт: `/tmp/claude-1000/-home-ipavlovsky-AmastyDir-adobeIO-storefront-testfront/24c4cca9-58a2-4626-a26d-651045227a0f/scratchpad/STOREFRONT_HANDOFF.md`
- Mesh endpoint (сверен `aio api-mesh describe` в `faq`, Stage): `https://edge-sandbox-graph.adobe.io/api/a38aee44-2a54-4b73-b6f4-6f014d8ac0f6/graphql`

## Что делаем
Новый EDS-блок, который на продуктовой странице показывает список FAQ-вопросов/ответов,
привязанных к текущему SKU (или к его категориям), в виде аккордеона. Секция полностью
скрыта, если вопросов нет.

## Уже согласовано с пользователем
- Не создаём git-ветку, не коммитим и не пушим — пользователь сам копирует `blocks/`/`scripts/`
  и оформит npm-пакет по аналогии с `packages/saas-app-storefront-amasty-custom-form-builder`.
- Тестовый продукт: `https://main--testfront--vanypav.aem.live/products/ivan/ivan`.
- `blocks/product-details/product-details.js` не трогаем — размещение блока в PDP только вручную
  через da.live (инструкцию дам после реализации).
- Ориентир по структуре кода — существующий `blocks/amasty-custom-form-builder` +
  `scripts/amasty-custom-form-builder/custom-form-fetch.js` (тот же паттерн: `getConfigValue`,
  `getHeaders('cs')`, `getCookie('auth_dropin_user_token')` для auth-заголовка, единая обработка
  GraphQL-ошибок).
- `config.json`: добавить `amasty.faq-endpoint` с эндпоинтом выше.

## Открытые технические вопросы (нужен ответ перед кодом)

1. **Рендер аккордеона.** В хендоффе предложены `Accordion`/`AccordionSection` из
   `@dropins/tools/components.js` — это preact-компоненты. В репозитории нет ни одного блока,
   который использует их напрямую как block-level UI (только внутри `scripts/__dropins__/*`
   и в `product-details.js` через `pdpRendered`/dropins `render()`-паттерн с контейнерами).
   Два варианта:
   - **A.** Использовать штатный dropins `render()`-паттерн (`import { render } from
     '@dropins/tools/render.js'`, `render.render(Accordion, {...})(container)`), как это сделано
     для `ProductHeader` и других контейнеров в `product-details.js`. Плюс: готовый a11y/стили от
     Adobe. Минус: подтягивает preact-рантайм ради одного блока, обязательно проверить сигнатуру
     через `researcher`, т.к. хендофф явно предупреждает не гадать API.
   - **B.** Нативный `<details>`/`<summary>` через `document.createElement` (без preact) —
     соответствует общему hard rule этого репо («DOM creation: только `document.createElement()`,
     никогда VNode/Preact»), проще, нет скрытых зависимостей. Стилизуем сами под общий вид блоков.
   - **Рекомендация:** B, если только нет явного требования визуально совпадать с другими
     dropins-аккордеонами (лимиты дизайна и так не готовы — см. §5 хендоффа).

2. **`getAmFaqSettings` нужен ли в этой задаче?** `getAmFaqProductQuestions(sku)` уже отдаёт
   готовый `sectionTitle` и список `items` — похоже, для блока PDP достаточно одного запроса,
   `getAmFaqSettings` (urlPrefix, questionLimit и т.д.) нужен только заданиям №11/№13.
   Подтверди: в №10 второй запрос не нужен.

3. **CSS-класс блока.** Хендофф явно требует держаться BYOM-конвенции класса
   (`amasty-faq-product-questions` — буквы/цифры + одиночные дефисы, без `_` и `--`) для
   консистентности с будущим №13. Подтверди имя блока как есть.

4. **Fallback при ошибке сети/меша.** Секция скрывается, если `items` пуст — а если сам запрос
   упал (сеть/500)? Скрыть так же тихо (без вопросов — это не критичный виджет), или показать
   ненавязчивое сообщение об ошибке?

## Ответы на открытые вопросы (дополнительное исследование)

1. **Рендер аккордеона — вариант "дропин" (подтверждено пользователем).** Проверил
   `scripts/__dropins__/tools/types/elsie/src/components/Accordion/Accordion.d.ts` —
   `Accordion`/`AccordionSection` это `FunctionComponent`, `children`/контент требуют VNode,
   `document.createElement` не годится напрямую. Нашёл прецедент **в этом же репо**:
   `scripts/amasty-custom-form-builder/ui-form-elements/alert-banner.js` использует
   `import { X, provider as UI } from '@dropins/tools/components.js'` +
   `import { createElement as createVNode } from '@dropins/tools/preact-compat.js'`, затем
   `UI.render(Component, { ...props, children: createVNode(...) })(container)`. Следуем этому же
   паттерну для Accordion/AccordionSection — это санкционированный мост между hard rule (никакого
   JSX/h() в разметке блока) и dropins-примитивами, которым нужен VNode.
2. **`getAmFaqSettings` не нужен — подтверждено чтением бэкенда.** Прочитал
   `faq/src/commerce-backend-ui-2/actions/storefront/get-product-questions/index.js` (Stage) —
   `sectionTitle` и лимит (`normalizeQuestionLimit(settings.questionLimit)`) уже применяются
   сервером в mongo-пайплайне (`$sort` + `$limit`). Refinement Information в тикете упоминает
   `get-settings-public` только как соседний экшен из задачи №9, не как зависимость №10. Одного
   `getAmFaqProductQuestions(sku)` достаточно.
3. **CSS-класс `amasty-faq-product-questions`** — подтверждён пользователем, использую как есть.
4. **Ошибка сети/500** — молча скрыть секцию, как и при пустых `items` (подтверждено
   пользователем).

## Phase 2: Architectural Plan

### Решение
- `blocks/amasty-faq-product-questions/amasty-faq-product-questions.js` + `.css`
- `scripts/amasty-faq/faq-fetch.js` — GraphQL fetch-хелпер, 1:1 по структуре с
  `scripts/amasty-custom-form-builder/custom-form-fetch.js`
- `scripts/amasty-faq/queries/am-faq-product-questions.graphql.js` — строка запроса, по образцу
  `queries/am-custom-form.graphql.js`

### Внешняя интеграция
- Endpoint: `getConfigValue('amasty.faq-endpoint')` (новый ключ в `config.json`, значение —
  сверенный mesh endpoint Stage)
- POST, `Content-Type: application/json`, `...getHeaders('cs')` (store view/env заголовки, как в
  custom-form-fetch.js) — `Authorization` НЕ нужен (query публичный, без гейта)
- Запрос: `getAmFaqProductQuestions(sku: $sku)` → `{ sectionTitle, items: [{ urlKey, title,
  answer, metaTitle, metaDescription, position, categoryUrlKeys }] }`
- Ошибка HTTP/сеть/GraphQL-errors → лог в консоль (`console.error`, по паттерну блока), секция не
  рендерится (пустой контейнер, без текста об ошибке)
- `items` пуст → секция не рендерится вовсе (ни заголовка, ни контейнера)

### Интеграция с существующим кодом
- SKU: `pdpApi.getSkuFromUrl()` (дроп-ин `@dropins/storefront-pdp/api.js`, как в
  `product-details.js`), фолбэк `events.lastPayload('pdp/data')?.sku`
- Обёртка секции — `document.createElement` (заголовок `<h2>` = `sectionTitle` из ответа,
  контейнер аккордеона)
- Сам аккордеон — `Accordion`/`AccordionSection` из `@dropins/tools/components.js` через
  `provider as UI` + `createVNode` для контента ответа (`answer` — санитайзенный HTML, через
  `dangerouslySetInnerHTML: { __html: item.answer }` в VNode — это и есть innerHTML-эквивалент,
  без повторного эскейпинга)
- `AccordionSection` получает обязательный `ariaLabelTitle` = текст вопроса (`item.title`)
- Блок НЕ встраивается в `product-details.js` — размещается вручную через da.live (инструкцию дам
  после реализации)

### Безопасность
- Публичный, неавторизованный GraphQL-запрос — нет секретов, нет токенов
- `answer` уже отсанитайзен на бэкенде (разрешённые теги без `script`/`style`/событийных
  атрибутов) — доверяем контракту, повторно не чистим

### Производительность
- Один запрос на рендер PDP, без кэширования в sessionStorage (значения не настройки мерчанта,
  а контентные данные конкретного SKU — кэшировать нечего, см. §3 хендоффа, где sessionStorage
  предлагался только для `getAmFaqSettings`, который мы не используем)

### Тестирование
- `npm run lint` перед финалом
- Ручная проверка в браузере на `https://main--testfront--vanypav.aem.live/products/ivan/ivan`
  (`tester` skill) — потребуется вручную добавить блок на страницу в da.live (дам инструкцию)

## Phase 2: Architectural Plan Presented
Date: 2026-09-17
Status: Awaiting User Approval ⏸️

## Phase 2: Complete ✅
User Approved: Yes
Approval Date: 2026-09-17

## Phase 3: Implementation Approach Selected
Approach: Option B (прямая реализация)
Selection Date: 2026-09-17

## Phase 4: Implementation Started
Date: 2026-09-17

## Phase 4: Implementation Complete ✅
Date: 2026-09-17
Files:
- `blocks/amasty-faq-product-questions/amasty-faq-product-questions.js`
- `blocks/amasty-faq-product-questions/amasty-faq-product-questions.css`
- `scripts/amasty-faq/faq-fetch.js`
- `scripts/amasty-faq/queries/am-faq-product-questions.graphql.js`
- `config.json` — добавлен `amasty.faq-endpoint`
Проверено:
- `npx eslint` / `npx stylelint` — чисто
- Прямой curl к mesh-эндпоинту с `sku=ivan` — реальные данные (2 вопроса), контракт совпадает

## Phase 4.5: Testing Decision
**Status:** Testing Completed
**Date:** 2026-09-17
**Results:**
- Пользователь вручную добавил блок `Amasty Faq Product Questions` в da.live-документ продукта
  `ivan/ivan` (таблица с именем блока, без библиотеки компонентов — в проекте у ни одного блока
  нет `component-models.json`, добавление всегда ручное).
- Первый прогон (headless Playwright, `sku=ivan`, `https://main--testfront--vanypav.aem.live/products/ivan/ivan`):
  блок не рендерился. Причина — CORS: `mesh.json` → `responseConfig.CORS.origin` =
  `{env.STOREFRONT_DOMAIN}`, значение было `https://main--testfront--VanyPav.aem.live`
  (с большими буквами), а реальный origin — `https://main--testfront--vanypav.aem.live`
  (lowercase, как всегда у AEM Code Sync). Запрос уходил, но браузер резал ответ до чтения
  (`TypeError: Failed to fetch`), блок тихо самоудалялся — как и задумано при ошибке.
- Пользователь поправил источник `STOREFRONT_DOMAIN` для меша и выполнил `aio api-mesh update
  mesh.json` в `faq` (workspace Stage) — `aio api-mesh status` → "Mesh provisioned successfully".
- Повторный прогон (headless Playwright + скриншот): блок рендерится полностью — заголовок
  "Product questions" (`<h2>`), аккордеон с двумя вопросами, ответы как HTML (`<p>ук</p>`,
  `<p>test</p>`), клик по секции разворачивает/сворачивает корректно, иконка меняется. Ошибок в
  консоли по нашему коду нет.
- Не относящиеся к задаче, уже существовавшие на странице ошибки (не трогать): `enrichment` блок —
  404 + `SyntaxError` при парсинге индекса; `product-recommendations` — GraphQL-ошибка
  `Unknown argument "pageType"`. Оба не связаны с PDT-32311.

## Phase 1: Complete ✅
Date: 2026-09-17
