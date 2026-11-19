# Встраивание

## Движок напрямую

```ts
import { createFishingGame } from '$lib/minigames/fishing/engine'
import { FISHING_ASSETS_CDN } from '$lib/constants'

const game = await createFishingGame({
	container: document.getElementById('game')!,
	publicBase: FISHING_ASSETS_CDN,
	storagePrefix: 'fishing-game',
	onCatch: (event) => console.log(event)
})

await game.flushProgress()
game.destroy()
```

Опции: `container` (обязательно), `publicBase` (корень CDN, от него считаются
`fishing/`, `cursors/` и `ice-480.webp`), `assetBase` (по умолчанию
`${publicBase}/fishing`), `storagePrefix`, `muted`, `startScreen` (`menu` | `game`),
`progress`, `locations`, `onExit`, `onCatch`, `onProgress`, `onReady`. Методы:
`restart`, `pause`, `resume`, `showMenu`, `setMuted`, `setLocations`,
`flushProgress`, `destroy`.

Абсолютный `publicBase` обязателен на вложенном маршруте: SvelteKit отдаёт
`import.meta.env.BASE_URL` относительным (`./`), и путь превратился бы в
`/minigames/fishing/fishing`. Переопределяется переменной
`VITE_FISHING_ASSETS_URL` (см. `src/routes/minigames/fishing/+page.svelte`).

## Закрытые водоёмы

`locations` закрывает уровень до начала игры: `false` напротив id водоёма
(`cove` — бухта, `deep` — омут, `rapids` — плёс). Всё, что не перечислено,
остаётся открытым.

```ts
const game = await createFishingGame({
	container: document.getElementById('game')!,
	locations: { cove: false } // бухта закрыта, омут и плёс открыты
})

// После покупки/разблокировки — на ходу, без перезапуска:
game.setLocations({ cove: true })
```

Закрытый водоём не исчезает с экрана: в раунде его карточка-мини-превью в углу
остаётся, но вместо кадра воды, названия и погоды на ней запаянная плитка с
замком и надписью «НЕДОСТУПНО», и переход по ней заблокирован. Игра никогда не
стартует на закрытом водоёме: сохранённый выбор откатывается на первый открытый,
а `startGame(areaId)` с закрытым id открывает первый доступный.

## Svelte

`src/lib/components/FishingGame.svelte` — Svelte 5 (runes) обёртка;
маршрут `src/routes/minigames/fishing` монтирует её на весь viewport. Движок она
импортирует динамически (`await import('$lib/minigames/fishing/engine')` в `onMount`),
поэтому безопасна для SSR: `window` и `document` не попадают в модульный скоуп.

```svelte
<script lang="ts">
	import { FISHING_ASSETS_CDN } from '$lib/constants'
	import FishingGame from '$lib/components/FishingGame.svelte'
</script>

<div class="fishing-shell">
	<FishingGame
		storagePrefix="aukus5-fishing"
		publicBase={FISHING_ASSETS_CDN}
		startScreen="menu"
		onExit={() => history.back()}
		onError={handleFailure}
	/>
</div>
```

Пропсы: `publicBase`, `assetBase`, `storagePrefix`, `muted`, `startScreen`,
`progress`, `locations`, `onExit`, `onCatch`, `onProgress`, `onReady`, `onError`,
`class`. Экспортируемые методы: `restart`, `pause`, `resume`, `showMenu`,
`setMuted`, `setLocations`, `flushProgress`.

## Телефоны

Контейнер должен быть растянут на весь экран или на заданную рамку: игра считает
letterbox от его `clientWidth`/`clientHeight`. Safe-area вырезов и динамическую
высоту (`dvh`) обеспечивает хост: здесь это класс `.fishing-shell` из `<style>`
страницы `src/routes/minigames/fishing/+page.svelte` — `100dvh` плюс
`env(safe-area-inset-*)`. Готового глобального CSS у мини-игры нет: правила канваса
живут в `<style>` самой `FishingGame.svelte`, а оболочку хост описывает у себя.
Отступы от выреза работают только вместе с `viewport-fit=cover` во `viewport`-мете;
в `src/app.html` его сейчас нет, то есть на iPhone вырез пока не учитывается.
Адаптация под тач, ориентация и метрики — в [mobile.md](mobile.md).

## Прогресс в БД

```ts
import { createFishingGame, createHttpProgressRepository } from '$lib/minigames/fishing/engine'

const game = await createFishingGame({
	container: document.getElementById('game')!,
	publicBase: FISHING_ASSETS_CDN,
	progress: createHttpProgressRepository({
		loadUrl: '/api/progress', // GET  -> ProgressSnapshot | null
		saveUrl: '/api/progress', // PUT  <- ProgressSnapshot
		headers: { Authorization: `Bearer ${token}` }
	})
})
```

Свой репозиторий — объект с `load(): Promise<unknown>` и
`save(snapshot): Promise<void>`. Сохранение дебаунсится, сериализуется и повторяется
при ошибке. Локальный вариант по умолчанию — `LocalProgressRepository` под
`storagePrefix` (`aukus5-fishing` на маршруте).
