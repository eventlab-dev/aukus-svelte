<script lang="ts">
	import type { CommonGameItem } from '$lib/types'
	import { formatMs, renderToHTML } from '$lib/utils'

	type Props = {
		game: CommonGameItem
	}

	let { game }: Props = $props()

    const parsedReview = $derived(renderToHTML(game.review))

	const statusText = $derived.by(() => {
        const time = formatMs(game.game_time * 1000)
        let diffText = ''
        switch (game.difficulty) {
            case 'easy':
                diffText = ' на легком'
                break
            case 'normal':
                diffText = ''
                break
            case 'hard':
                diffText = ' на сложном'
                break
            case 'very-hard':
                diffText = ' на очень сложном'
                break
			case null:
				diffText = ''
				break
            default: {
                const error: never = game.difficulty
                throw new Error(`Unknown difficulty level: ${error}`)
            }
        }

		switch (game.completion_status) {
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
				const error: never = game.completion_status
				throw new Error(`Unknown game type: ${error}`)
			}
		}
	})
</script>

<div class="max-w-[500px] p-2">
	<div class="flex flex-col gap-2">
		<div class="text-xl">{game.game_title}</div>
		<div>{statusText}</div>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<div class="[&>*]:inline">{game.rating_num}/10 — {@html parsedReview}</div>
	</div>
</div>  
