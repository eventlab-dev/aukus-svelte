<script lang="ts">
	import { formatDuration, renderToHTML } from '$lib/utils'
	import ImageLoader from '$lib/components/ImageLoader.svelte'

	type Props = {
		game: PlayerMove
		title: str
	}

	let { game, title }: Props = $props()
</script>

<div class="flex w-[440px] flex-col gap-3 rounded-xl bg-card p-3">
	<div class="flex justify-between text-[#9F9F9F]">
		<div>{title}</div>
		<div>{formatDuration(game.item_duration)}</div>
	</div>
	<div class="flex gap-2">
		<div>
			<ImageLoader
				src={game.cover_image_url || ''}
				alt={game.item_title || ''}
				class="h-auto w-[80px]"
			/>
		</div>
		<div class="text-2xl font-bold">{game.item_title} — {game.item_rating}/10</div>
	</div>
	<div>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html renderToHTML(game.item_review)}
	</div>
</div>
