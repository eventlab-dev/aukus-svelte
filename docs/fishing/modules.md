# Модули

## Дерево

Корень движка — `src/lib/minigames/fishing/`, Svelte-обёртка лежит отдельно, в
`src/lib/components/`. Ниже перечислены подсистемы, а не каждый
файл: внутри `ui/`, `game/` и `scenes/` модулей заметно больше.

```
src/lib/components/
  FishingGame.svelte            Svelte 5-обёртка (лениво импортирует движок; правила канваса)
src/lib/minigames/fishing/
  art/                          единственный ассет в бандле: логотип загрузочного экрана
  engine/
    index.ts                    публичный API (createFishingGame)
    Game.ts                     Game + destroy + create
    GameBase.ts                 поля, конструктор, accessors, ввод-хуки
    GameBootLayer.ts            boot, previews, boot-сцена
    GameInputLayer.ts           layout/resize, курсор, профиль ввода
    GameDevLayer.ts             F2/F3/F8 панели, setWeather, setTimeOfDay
    GameScreensLayer.ts         навигация и публичные действия
    GameContext.ts              узкий контракт хоста
    options.ts  types.ts  progress.ts  storage.ts
    assets.ts  fonts.ts  cursors.ts  fullscreen.ts
    inputProfile.ts  renderScale.ts  fishWeight.ts
    fish/                       species, rosters by area, tiers, activity, labels, validate
                                pearls (12 сортов) и shell (ракушка-носитель)
    world/                      weather, colors, WorldClock
    audio/                      catalog, core, cues, loops, ambience, AudioKit
    audioMix.ts                 таблица громкостей и каналов микса
    areas.ts  config.ts  texts.ts  utils.ts
    game/
      CastFlow.ts               фасад фазы раунда
      cast/                     CastFlowCore, CastFlowInput, CastFlowState, setup
      fight/                    FightModel, motion, stamina, counter, bubbles, zone, pace, pause, zoneTuning
      fightView/                RingView, WarningView, BarsView, Minigame, zoneClock, zoneWedge
      scenes/
        FishingScene.ts         фасад
        stage/                  angler, cast, fx, catch, stamina-дуга
        dither.ts  grass.ts  props.ts  water*.ts  pixelWater.ts  cloudShadow.ts
        logs/  river/  cove/  pool/   рендереры водоёмов
      Atmosphere.ts             фасад
      AtmosphereBase/Sky/Snow.ts
      auroraTex.ts              два бесшовных полотна сияния
      behaviors.ts  castAim.ts  castPick.ts  castSafety.ts  fog.ts
      FightStage.ts  FightFocus.ts  fightRing.ts  JuiceFx.ts  Minigame.ts
      shinyShader.ts  platinumShader.ts   окрас шайни и платина слота
      pearl/                     art.ts (ракушка), PearlView (шейдер), PearlReveal
    screens/
      GameScreen.ts             фасад
      game/                     GameScreenCore + GameOverlays
      MenuScreen.ts  HelpScreen.ts  CodexScreen.ts
    ui/
      theme.ts  Button.ts  palette.ts  tier.ts  Screen.ts  ScreenManager.ts  metrics.ts
      rect.ts                         прямоугольники: пересечение и зазор
      weatherRail.ts  railCard.ts     полоса погоды: строка и её карточки
      CastHint.ts  holdIcon.ts        подсказка заброса и значок «зажми ЛКМ»
      HelpCard.ts  richCopy.ts        справка: попап и подсветка копии
      TutorialHint.ts                 записка обучения: раскладка вокруг боя
      fight/                    FightControls, grabGesture (тач)
      mix/                      AudioMixPanel + MixRow + layout
      codex/                    CodexView + реестр + карточка записи + devPreview
      остальные HUD/панели/курсор/фон
```

Отдельно от движка скриптов нет: всё живёт в `engine/`, а проверки — это
`npm run check` и `npm run build`.

## Куда добавлять

| Задача                      | Куда                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| Новый вид рыбы              | `fish/roster-<area>.ts`, `FISH_TEXT`, `FISH_TEMPERAMENT`, `behaviors.ts`    |
| Новый сорт жемчуга          | `fish/pearls.ts`, `PEARL_TEXT`, ячейка 16×16 в `art/pearls-sheet.png`       |
| Новый водоём                | `areas.ts`, `game/scenes/<id>/`, `game/scenes/index.ts`, `audio/catalog.ts` |
| Новый звук                  | `audio/catalog.ts` + заливка файла на CDN (`assets-and-audio.md`)           |
| Новый экран                 | `screens/`, регистрация в `GameScreensLayer`                                |
| Новый HUD-виджет            | `ui/`, композиция в `screens/game/GameScreenCore.ts`                        |
| Новое правило боя           | `game/fight/`; баланс проверять игрой руками                                |
| Новая настройка/сохранение  | `types.ts`, `progress.ts` или `storage.ts`                                  |
| Правка хоста (маршрут, CDN) | `src/routes/minigames/fishing/`, [host.md](host.md)                         |

## Правила

- Размер файла — запах, а не лимит: делим по шву; сторожа размера в репозитории нет.
- `Game` не импортируется экранами: только `GameContext`.
- Публичный API — только `src/lib/minigames/fishing/engine/index.ts`; всё остальное
  внутреннее.
- Стиль UI (обводки, отступы попапов, шрифты, состояния) — [style-guide.md](style-guide.md).
- `src/lib/components/FishingGame.svelte` собирается вместе с сайтом, поэтому его правки
  проходят `npm run check` наравне с движком.
- Правка `game/fight/` проверяется игрой руками: прогонщика ботов в репозитории нет.
