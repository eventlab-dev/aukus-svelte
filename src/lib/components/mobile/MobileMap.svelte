<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import { LOGO_URL } from '$lib/constants'
	import { SvelteMap } from 'svelte/reactivity'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'
	import ArrowUp from '$lib/components/icons/new/ArrowUp.svelte'
	import ArrowDown from '$lib/components/icons/new/ArrowDown.svelte'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
	import { Button } from '../ui/button'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		navigateToPlayer: (slug: string) => void
	}

	let { navigateToPlayer }: Props = $props()

	const app = getAppManager()
	
	const playersByPosition = $derived.by(() => {
		const map = new SvelteMap<number, PlayerData[]>()
		for (const player of app.players) {
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
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		[0]
	]

	const players101 = $derived(playersByPosition.get(101))

	let selectedPlayers = $state<PlayerData[] | null>(null)
	let dialogOpen = $state(false)

	function handleCellClick(playersInCell: PlayerData[] | undefined) {
		if (!playersInCell || playersInCell.length === 0) return
		
		if (playersInCell.length === 1) {
			navigateToPlayer(playersInCell[0].slug)
		} else {
			selectedPlayers = playersInCell
			dialogOpen = true
		}
	}

	function handlePlayerSelect(player: PlayerData) {
		dialogOpen = false
		navigateToPlayer(player.slug)
		selectedPlayers = null
	}
</script>

{#snippet playerIcon(player: PlayerData)}
	<button
		onclick={() => {
			navigateToPlayer(player.slug)
		}}
		class="relative"
	>
		<PlayerAvatar
			src={player.avatar_link ?? ''}
			name={player.username}
			isOnline={Boolean(player.is_online)}
			size="small"
		/>
	</button>
{/snippet}

<div class="mb-5 flex justify-center">
	<img src={LOGO_URL} alt="logo" class="h-20" />
</div>

<div class="flex flex-col gap-[5px]">
	<!-- Top 3 winners displayed above the map -->
	<div class="flex w-full gap-[5px] mb-2">
		<div class="flex w-full gap-1 font-bold text-[#666666]">
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-[#222222] p-2">
				<div>1</div>
				{#if app.winners[0]}
					{@render playerIcon(app.winners[0])}
				{/if}
			</div>
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-[#222222] p-2">
				<div>2</div>
				{#if app.winners[1]}
					{@render playerIcon(app.winners[1])}
				{/if}
			</div>
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-[#222222] p-2">
				<div>3</div>
				{#if app.winners[2]}
					{@render playerIcon(app.winners[2])}
				{/if}
			</div>
		</div>
	</div>
	
	<!-- Cell 101 with custom width and same height as grid cells -->
	<div class="flex w-full gap-[5px]">
		<div
			class="relative flex w-fit items-center justify-center overflow-hidden rounded-md bg-[#222222] text-center font-bold text-[#666666] px-2 py-2"
			style="height: calc((100vw - 45px) / 10);"
		>
			<div class="flex flex-col items-center gap-1">
				<div class="text-sm">101 - Финальный рывок</div>
				{#if players101}
					<div class="flex flex-wrap items-center justify-center gap-0.5">
						{#each players101 as player (player.slug)}
							{@render playerIcon(player)}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
	
	{#each cells as row, idx (idx)}
		<div class="flex w-full gap-[5px]">
			{#each row as cellId (cellId)}
				{#if cellId === 0}
					{@const playersOnStart = playersByPosition.get(cellId)}
					<button
						onclick={() => handleCellClick(playersOnStart)}
						class="flex w-full items-center gap-1 rounded-md bg-[#222222] p-2"
					>
						<div class="font-bold text-[#666666]">Старт</div>
						{#if playersOnStart}
							<div class="flex flex-wrap items-center justify-center gap-0.5">
								{#if playersOnStart.length === 1}
									{@render playerIcon(playersOnStart[0])}
								{:else}
									{#each playersOnStart as player (player.slug)}
										<PlayerAvatar
											src={player.avatar_link ?? ''}
											name={player.username}
											isOnline={Boolean(player.is_online)}
											size="small"
										/>
									{/each}
									{#if playersOnStart.length > 1}
										<div class="ml-1 text-xs text-[#666666]">({playersOnStart.length})</div>
									{/if}
								{/if}
							</div>
						{/if}
					</button>
				{:else}
					<div
						class="relative flex aspect-square flex-1 items-center justify-center overflow-hidden rounded-md bg-[#222222] text-center font-bold text-[#666666]"
					>
						{#if cellId % 10 === 0 && !playersByPosition.has(cellId)}
							{cellId}
						{/if}
						{#if laddersByCell[cellId]}
							<ArrowUp color="green" />
						{/if}
						{#if snakesByCell[cellId]}
							<ArrowDown color="red" />
						{/if}
						{#if playersByPosition.has(cellId)}
							{@const playersInCell = playersByPosition.get(cellId)}
							{#if playersInCell && playersInCell.length === 1}
								{@render playerIcon(playersInCell[0])}
							{:else if playersInCell && playersInCell.length > 1}
								<button
									onclick={() => handleCellClick(playersInCell)}
									class="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5"
								>
									{#each playersInCell as player (player.slug)}
										<PlayerAvatar
											src={player.avatar_link ?? ''}
											name={player.username}
											isOnline={Boolean(player.is_online)}
											size="small"
										/>
									{/each}
									<div class="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-white text-center py-0.5">
										{playersInCell.length}
									</div>
								</button>
							{/if}
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

{#if selectedPlayers && selectedPlayers.length > 1}
	<Dialog bind:open={dialogOpen}>
		<DialogContent>
			<DialogTitle>Выберите игрока</DialogTitle>
			<div class="flex flex-col gap-2">
				{#each selectedPlayers as player (player.slug)}
					<Button
						variant="outline"
						class="flex items-center gap-3 p-3"
						onclick={() => handlePlayerSelect(player)}
					>
						<PlayerAvatar
							src={player.avatar_link ?? ''}
							name={player.username}
							isOnline={Boolean(player.is_online)}
							size="small"
						/>
						<span class="font-semibold">{player.username}</span>
					</Button>
				{/each}
			</div>
		</DialogContent>
	</Dialog>
{/if}
