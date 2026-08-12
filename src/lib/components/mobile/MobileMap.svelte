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
		Array.from({ length: 10 }, (_, i) => 100 - i),
		Array.from({ length: 10 }, (_, i) => 81 + i),
		Array.from({ length: 10 }, (_, i) => 80 - i),
		Array.from({ length: 10 }, (_, i) => 61 + i),
		Array.from({ length: 10 }, (_, i) => 60 - i),
		Array.from({ length: 10 }, (_, i) => 41 + i),
		Array.from({ length: 10 }, (_, i) => 40 - i),
		Array.from({ length: 10 }, (_, i) => 21 + i),
		Array.from({ length: 10 }, (_, i) => 20 - i),
		Array.from({ length: 10 }, (_, i) => 1 + i),
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

	function isLastInRow(cellId: number) {
		return cellId % 10 === 0
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
		<div class="flex w-full gap-1 font-bold" style="height: calc((100vw - 45px) / 10);">
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-card p-2">
				<div>1</div>
				{#if app.winners[0]}
					{@render playerIcon(app.winners[0])}
				{/if}
			</div>
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-card p-2">
				<div>2</div>
				{#if app.winners[1]}
					{@render playerIcon(app.winners[1])}
				{/if}
			</div>
			<div class="flex flex-1 items-center gap-[20px] rounded-md bg-card p-2">
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
			class="relative flex w-full items-center justify-center overflow-hidden rounded-md bg-card text-center font-bold  px-2 py-2"
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
						class="flex w-full items-center gap-1 rounded-md bg-card p-2 mt-2"
						style="height: calc((100vw - 45px) / 10);"
					>
						<div class="font-bold">Старт</div>
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
										<div class="ml-1 text-xs">({playersOnStart.length})</div>
									{/if}
								{/if}
							</div>
						{/if}
					</button>
				{:else}
				{@const isLast = isLastInRow(cellId)}
				{@const isLadder = Boolean(laddersByCell[cellId])}
				{@const isSnake = Boolean(snakesByCell[cellId])}
				{@const cellType = isLadder ? 'ladder' : isSnake ? 'snake' : ''}
					<div
						class="relative flex aspect-square flex-1 {isLast ? 'mt-0' : 'mt-8'} items-center justify-center overflow-hidden rounded-md bg-card text-center font-bold data-[celltype=ladder]:bg-green-500 data-[celltype=snake]:bg-red-400"
						data-celltype={cellType}
					>
						{#if laddersByCell[cellId]}
							<div class="absolute bottom-1 ">
								<div class="text-sm ">{laddersByCell[cellId].cellTo}</div>
								<ArrowUp />
							</div>
						{:else if snakesByCell[cellId]}
							<div class="absolute top-1 ">
								<ArrowDown />
								<div class="text-sm">{snakesByCell[cellId].cellTo}</div>
							</div>
						{:else}
						<div class="absolute">{cellId}</div>
						{/if}
						<!-- {#if cellId % 10 === 0 && !playersByPosition.has(cellId)} -->
							<!-- {cellId} -->
						<!-- {/if} -->
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
			<DialogTitle>Выбери игрока</DialogTitle>
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
