<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerData } from '$lib/types'
	import { SvelteMap } from 'svelte/reactivity'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'

	const { players } = getAppManagerContext()

	const playersByPosition = $derived.by(() => {
		const map = new SvelteMap<number, PlayerData[]>()
		for (const player of $players) {
			if (!map.has(player.map_position)) {
				map.set(player.map_position, [])
			}
			map.get(player.map_position)!.push(player)
		}
		return map
	})

	const cells = [
		[100, 99, 98, 97, 96, 95, 94, 93, 92, 91],
		[81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
		[80, 79, 78, 77, 76, 75, 74, 73, 72, 71],
		[61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
		[60, 59, 58, 57, 56, 55, 54, 53, 52, 51],
		[41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
		[40, 39, 38, 37, 36, 35, 34, 33, 32, 31],
		[21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
		[20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
	]
</script>

<div class="flex flex-col gap-[5px]">
	{#each cells as row, idx (idx)}
		<div class="flex w-full gap-[5px]">
			{#each row as cellId (cellId)}
				<div
					class="flex aspect-square flex-1 items-center justify-center rounded-md bg-[#222222] text-center font-bold text-[#666666]"
				>
					{#if cellId % 10 === 0}
						{cellId}
					{/if}
					{#if playersByPosition.has(cellId)}
						<div>
							{#each playersByPosition.get(cellId) as player (player.slug)}
								<PlayerAvatar
									src={player.avatar_link ?? ''}
									name={player.username}
									isOnline={Boolean(player.is_online)}
									size="small"
								/>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
	<div class="w-fit rounded-md bg-[#222222] p-2 font-bold text-[#666666]">Старт</div>
</div>
