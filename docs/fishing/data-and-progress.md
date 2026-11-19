# Данные и прогресс

## Виды рыб

`fish/species.ts` — `FishSpecies`: id, имя, вес, spawn weight, speed, resistance,
tint, tier, area, behavior, окна, погода. Ростер разбит по водоёмам:
`roster-lake.ts` (16), `roster-river.ts` (12), `roster-sea.ts` (12) → `roster.ts`.

- `tiers.ts` — `TIER_SHARE` и `TIER_WEIGHT`.
- `temperament.ts` — фиксированный характер каждого вида.
- `labels.ts` — окна, погода, описание для кодекса.
- `validate.ts` — `validateFishData`; вызывается на dev-boot.

## ProgressSnapshot

```ts
interface ProgressSnapshot {
	version: number
	selectedArea: 'cove' | 'deep' | 'rapids'
	fish: Record<string, { caught: number; bestKg: number }>
	updatedAt: number
}
```

`ProgressTracker` дебаунсит сохранение (500 мс), сериализует записи и повторяет при
ошибке. `flushProgress()` форсирует отправку.

`ProgressRepository` — `load(): Promise<unknown>`, `save(snapshot): Promise<void>`.
Готовые адаптеры: `LocalProgressRepository`, `MemoryProgressRepository`,
`createHttpProgressRepository`. Публичный API — `src/lib/minigames/fishing/engine/index.ts`.

## Расписание погоды

`WorldStore` (`<prefix>:world:v1`) хранит `WorldData`:

```ts
interface WorldData {
	weather?: Record<string, string> | string // legacy: id фронтов по водоёмам
	areas?: Record<string, SavedArea> // расписание
}
interface SavedArea {
	current: SavedFront
	queue: SavedFront[] // очередь, которую рисует полоса прогноза
}
interface SavedFront {
	id: string
	endsAt: number // epoch-секунды, когда фронт заканчивается
	length: number // полная длительность, секунды
}
```

`WorldClock` восстанавливает очередь по `length`, при загрузке догоняет истёкшие
фронты и пишет обе формы: `areas` для этого билда, `weather` — чтобы сборка без
расписания прочитала то же небо.

## Ключи localStorage

| Ключ                   | Что                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `<prefix>:progress:v1` | прогресс справочника и выбранный водоём                                              |
| `<prefix>:settings:v1` | mute, dev-оверрайды микса                                                            |
| `<prefix>:world:v1`    | расписание погоды: текущий фронт (`endsAt`, `length`) и очередь прогноза по водоёмам |

`prefix` по умолчанию `fishing-game`, переопределяется опцией `storagePrefix`.
Маршрут `src/routes/minigames/fishing` передаёт `aukus5-fishing`, поэтому в браузере
ключи выглядят как `aukus5-fishing:progress:v1` и т. д.

## Миграции

- id водоёмов исторические: `deep` (озеро), `rapids` (река), `cove` (море);
  не переименовывать.
- старые погодные id `rain`/`storm` переводятся в `snow`/`blizzard` в
  `world/WorldClock.ts`.
- старый `world:v1` (строка или карта id) читается как fallback: фронт после
  обновления начнётся заново, потому что времён в нём не было; начиная с первого
  сохранения прогноз уже переживает перезагрузку.
- `parseProgress` чистит неизвестные поля и битые записи; версия схемы — 2.

При изменении схемы добавляйте миграцию в `progress.ts` и обновляйте этот документ.
