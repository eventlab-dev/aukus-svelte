<script lang="ts">
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { formatDateTime, formatDuration } from '$lib/utils'
	import { fade } from 'svelte/transition'
	import ImageLoader from '../ImageLoader.svelte'
	import { Badge } from '../ui/badge'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const app = getAppManager()
	const player = $derived(app.playersBySlug.get(playerSlug)!)
</script>

<div
	class="flex w-[800px] flex-col rounded-xl p-3"
	style="background-color: {player?.color || '#888888'}"
>
	<div class="flex justify-between">
		<div class="flex gap-1.5">
			<Badge variant="white">Игра на стриме</Badge>
			{#if player.current_game_duration}
				<Badge variant="white">Играет {formatDuration(player.current_game_duration)}</Badge>
			{/if}
		</div>
		{#if player.current_game_updated_at}
			{formatDateTime(player.current_game_updated_at)}
		{/if}
	</div>
	<div class="mt-3 flex gap-3">
		{#if player.current_game}
			<ImageLoader
				src={player.current_game_cover || FALLBACK_GAME_POSTER}
				alt="game cover"
				class="h-[140px] w-[105px]"
			/>
		{/if}
		<div class="w-full space-y-3">
			<div class="text-2xl leading-[29px] font-bold" in:fade>{player.current_game || 'Выбирает игру...'}</div>
		</div>
	</div>
</div>
