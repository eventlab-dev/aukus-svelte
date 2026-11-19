# Архитектура

## Слои

```
данные:     types, config, areas, fish/, texts, world/
приложение: assets, audio/, progress, storage, options, GameContext
экраны:     screens/, ui/
геймплей:   game/ (CastFlow, Minigame, FightModel, Scene, Atmosphere)
```

Зависимости идут сверху вниз. `screens`, `ui` и `game` не импортируют класс `Game`:
им нужен только [`GameContext`](../../src/lib/minigames/fishing/engine/GameContext.ts).
Это единственный хост-контракт (assets, audio, clock, progress, навигация, mute).
Благодаря ему в графе **runtime-импортов нет циклов**; сторожа в репозитории нет,
правило держится на ревью.

`fish/` — чистые данные и запросы, без UI-палитры. `TIER_COLOR` живёт в
`ui/tier.ts`, `TIER_LABEL` — в `texts.ts`.

## Boot

1. `createFishingGame(options)` → `Game.create`.
2. Создаётся Pixi `Application`, считается letterbox, создаётся `Game`.
3. `GameBootLayer.boot`: первым делом запрашиваются курсоры, и `CursorOverlay`
   монтируется сразу, как только они пришли (страница прячет системный
   указатель); параллельно грузятся `loadGameAssets` и прогресс, рисуется
   boot-сцена, создаются `SettingsStore`, `WorldClock`, `AudioKit`,
   `ProgressTracker`.
4. `previewFor`/`AreaPreviewCache`: выбранный водоём рендерится в текстуру;
   остальные два и скриншоты помощи — на idle.
5. Показывается `MenuScreen` или сразу `GameScreen` (`startScreen`).

## Экраны и оверлеи

`ScreenManager` хранит один активный `Screen` и слой `IceVeil`.
`GameScreensLayer` — навигация (`showMenu`, `showHelp`, `showCodex`, `startGame`).
`GameScreen` собирает сцену, HUD, атмосферу, `CastFlow`, паузу и кодекс. Выбора
водоёма отдельным экраном нет: между водоёмами ходят карточками-мини-превью в
углах раунда (`AreaShortcuts`), и они же показывают водоёмы, закрытые хостом.

Попап может анимировать свой выезд сам (`Screen.animateOut`): тогда менеджер не
сдвигает экран целиком, и затемнение остаётся на месте, пока панель уезжает.
Кодекс так закрывается из меню и из паузы одинаково (`CodexScreen.animateOut`,
`CodexOverlay.beginClose`).

Порядок слоёв внутри `GameScreen.playfield`:

```
scene → fx (minigame) → bobberLayer → atmosphere → focus → fightHud
```

HUD, карточки водоёмов, прогноз, floaters и пауза лежат выше playfield. Снег/туман
не должны перекрывать шкалы боя, поэтому `fightHud` вынесен выше `atmosphere`.

## Поток раунда

```
idle → charging → waiting → bite → fighting → resolve → idle
```

`CastFlow` владеет таймерами и правилами, дергает сцену, звук, `JuiceFx`,
`FloaterLayer` и `FightStage`. `FightStage` создаёт `Minigame` → `FightModel`.
`FightModel` — чистая симуляция без Pixi: её можно гонять без сцены, но прогонщика
ботов в репозитории нет.

## Данные и сохранение

`ProgressTracker` — единственный владелец `ProgressSnapshot`; `WorldClock` — погодное
расписание на реальном времени; `SettingsStore` — mute и dev-оверрайды микса.
Подробности — [data-and-progress.md](data-and-progress.md).

## Сцены

`FishingScene` — общий сценический слой (рыбак, поплавок, линия, частицы, улов).
Мир рисует `SceneRenderer` из `game/scenes/<area>/` (слои-наследники: base → water →
banks → scenery → motion). `createFishingScene` выбирает renderer по id водоёма.
