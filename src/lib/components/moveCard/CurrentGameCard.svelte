<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { formatDateTime, formatDuration } from '$lib/utils'
	import { fade } from 'svelte/transition'
	import ImageLoader from '../ImageLoader.svelte'
	import { Badge } from '../ui/badge'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const { playersBySlug } = getAppManagerContext()
	const player = $derived($playersBySlug[playerSlug])
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
		<ImageLoader
			src={player.current_game_cover || FALLBACK_GAME_POSTER}
			alt="game cover"
			class="h-[140px] w-[105px]"
		/>
		<div class="w-full space-y-3">
			<div class="text-2xl leading-[29px] font-bold" in:fade>{player.current_game}</div>
		</div>
	</div>
</div>
