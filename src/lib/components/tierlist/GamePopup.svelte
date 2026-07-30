<script lang="ts">
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatMs, renderToHTML } from '$lib/utils'

	type Props = {
		game: PlayerMoveItem
	}

	let { game }: Props = $props()

    const parsedReview = $derived(renderToHTML(game.item_review))

	const statusText = $derived.by(() => {
        const time = formatMs(game.item_duration * 1000)
        let diffText = ''
        switch (game.difficulty_level) {
            case -1:
                diffText = ' на легком'
                break
            case 0:
                diffText = ''
                break
            case 1:
                diffText = ' на сложном'
                break
            case 2:
                diffText = ' на очень сложном'
                break
            default: {
                const error: never = game.difficulty_level
                throw new Error(`Unknown difficulty level: ${error}`)
            }
        }

		switch (game.type) {
			case 'completed': 
				return `Пройдено за ${time}${diffText}`
			case 'drop':
				return `Дроп через ${time}${diffText}`
			case 'movie':
				return `Просмотровый`
			case 'reroll':
				return `Реролл`
			case 'sheikh_moment':
				return `Шейх-дроп через ${time}${diffText}`
			default: {
				const error: never = game.type
				throw new Error(`Unknown game type: ${error}`)
			}
		}
	})
</script>

<div class="max-w-[500px] p-2">
	<div class="flex flex-col gap-2">
		<div class="text-xl">{game.item_title}</div>
		<div>{statusText}</div>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<div class="[&>*]:inline">{game.item_rating}/10 — {@html parsedReview}</div>
	</div>
</div>  
