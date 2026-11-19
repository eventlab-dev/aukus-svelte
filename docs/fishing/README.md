# Документация: «Зимняя рыбалка»

Подробные материалы по мини-игре. Это не пользовательская документация: читать
нужно только то, что требует задача.

Короткие правила для агентов — в корневом [`AGENTS.md`](../../AGENTS.md), секция 5.
Остальное разложено здесь: как игра подключена к сайту — [host.md](host.md),
устройство движка — [architecture.md](architecture.md) и
[modules.md](modules.md), правила игры — [gameplay.md](gameplay.md).

## Где что лежит

```
src/lib/minigames/fishing/
  engine/      движок на PixiJS: данные, сцены, бой, экраны, UI, звук
  art/         арт, который собирает Vite
src/lib/components/FishingGame.svelte   Svelte 5-обёртка (лениво импортирует движок;
                                        правила канваса)
src/routes/minigames/fishing/   страница-хост (стили .fishing-shell в её <style>)
```

## Проверки

| Команда         | Зачем                                                               |
| --------------- | ------------------------------------------------------------------- |
| `npm run check` | `svelte-kit sync` + `svelte-check`: типы движка, обёртки и маршрута |
| `npm run build` | production-сборка SvelteKit                                         |

Баланс боя автоматически не проверяется — `FightModel` здесь без прогонщика;
ориентиры и правила — [gameplay.md](gameplay.md).

## Документы

| Документ                                     | О чём                                                             |
| -------------------------------------------- | ----------------------------------------------------------------- |
| [host.md](host.md)                           | как игра встроена в сайт: маршрут, CDN, звук, телефон, dev-панели |
| [architecture.md](architecture.md)           | слои, boot, экраны, поток раунда, порядок рендера                 |
| [modules.md](modules.md)                     | дерево модулей, ответственность, куда добавлять код               |
| [gameplay.md](gameplay.md)                   | заброс, бой, погода, клёв, баланс                                 |
| [data-and-progress.md](data-and-progress.md) | виды рыб, схема прогресса, storage, миграции                      |
| [assets-and-audio.md](assets-and-audio.md)   | ассеты, шрифты, звук, F2/F3/F8                                    |
| [conventions.md](conventions.md)             | размер файлов, стиль, public API, docs                            |
| [style-guide.md](style-guide.md)             | UI: обводки, отступы попапов, шрифты, состояния, анимация         |
| [mobile.md](mobile.md)                       | что сделано для телефона и что осталось открытым                  |
| [embedding.md](embedding.md)                 | `createFishingGame`, Svelte, HTTP-прогресс                        |
| [credits.md](credits.md)                     | лицензии и авторы ассетов                                         |
