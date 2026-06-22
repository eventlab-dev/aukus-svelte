<script lang="ts" generics="T extends StatItem">
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Button } from '$lib/components/ui/button'
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { StatItem, TableHeaderType } from '$lib/types'
	import { getPlayerScoreDescription, getPlayerCleanScoreDescription, formatMs, formatDuration } from '$lib/utils'
	
	type Props = {
		data: T[]
		headers: TableHeaderType<T>[]
		navigateToPlayer?: (slug: string) => void
	}

	const { data, headers, navigateToPlayer }: Props = $props()

	const app = getAppManager()

	let sortByKey: keyof T | null = $state(null)
	let sortOrder: 1 | -1 = $state(1)

	const sortedData = $derived.by(sortRows)

	function sortRows() {
		return data.toSorted((a, b) => {
			if (!sortByKey) return 0

			if (a[sortByKey] > b[sortByKey]) {
				return sortOrder
			} else if (a[sortByKey] < b[sortByKey]) {
				return -sortOrder
			}

			return 0
		})
	}

	function selectSortKey(key: keyof T) {
		if (key === sortByKey) {
			sortOrder *= -1
			return
		}

		sortByKey = key
		sortOrder = -1
	}
</script>

<Table>
	<TableHeader>
		<TableRow>
			{#each headers as { key, name, width } (key)}
				<TableHead
					class="relative select-none data-[active=true]:text-foreground data-[avatar=true]:pointer-events-none"
					data-active={sortByKey === key}
					data-avatar={key === 'avatarLink'}
					style="width: {width}px"
					onclick={() => selectSortKey(key)}
				>
					{#if key === 'clean_score'}
						<Tooltip>
							<TooltipTrigger class="relative w-full cursor-pointer">
								{name}
								{#if sortByKey === key}
									<span class="absolute left-[calc(100%_+_4px)]">
										{#if sortOrder === 1}
											↑
										{:else}
											↓
										{/if}
									</span>
								{/if}
							</TooltipTrigger>
							<TooltipContent>Чистые очки: очки без учета умножения на ряд и без ачивок</TooltipContent>
						</Tooltip>
					{:else}
						<span class="relative">
							{name}
							{#if sortByKey === key}
								<span class="absolute left-[calc(100%_+_4px)]">
									{#if sortOrder === 1}
										↑
									{:else}
										↓
									{/if}
								</span>
							{/if}
						</span>
					{/if}
				</TableHead>
			{/each}
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each sortedData as player (player.username)}
			<TableRow>
				{#each headers as { key } (key)}
					{#if key === 'avatarLink'}
						<TableCell class="p-0">
							<Button
								variant="link"
								href={app.isMobile ? '' : `/players/${player.player_slug}`}
								class="p-0 text-foreground no-underline hover:text-[var(--player-color)]"
								style="--player-color: {player.color}"
								onclick={(e) => {
									if (app.isMobile && navigateToPlayer) {
										e.preventDefault()
										navigateToPlayer(player.player_slug)
									}
								}}
							>
								<ImageLoader
									src={player.avatarLink}
									alt={player.username}
									class="size-[27px] !rounded-full"
								/>
							</Button>
						</TableCell>
					{:else if key === 'total_score'}
						<TableCell class="data-[active=true]:text-foreground" data-active={sortByKey === key}>
							<Tooltip>
								<TooltipTrigger class="w-full text-left">
									{player[key]}
								</TooltipTrigger>
								<TooltipContent class="z-2000">
									{@const description = getPlayerScoreDescription(player)}
									{#each description as item (item)}
										<p>{item}</p>
									{/each}
								</TooltipContent>
							</Tooltip>
						</TableCell>
					{:else if key === 'clean_score'}
						<TableCell class="data-[active=true]:text-foreground" data-active={sortByKey === key}>
							<Tooltip>
								<TooltipTrigger class="w-full text-left">
									{player[key]}
								</TooltipTrigger>
								<TooltipContent class="z-2000">
									{@const description = getPlayerCleanScoreDescription(player)}
									{#each description as item (item)}
										<p>{item}</p>
									{/each}
								</TooltipContent>
							</Tooltip>
						</TableCell>
					{:else if key === 'games_time'}
						<TableCell class="data-[active=true]:text-foreground" data-active={sortByKey === key}>
							<Tooltip>
								<TooltipTrigger class="w-full text-left">
									{formatMs(player[key] as number)}
								</TooltipTrigger>
								<TooltipContent class="z-2000">Суммарное время по категориям стрима</TooltipContent>
							</Tooltip>
						</TableCell>
					{:else if key === 'username'}
						<TableCell
							class="py-0 text-foreground data-[active=true]:text-foreground"
							data-active={sortByKey === key}
						>
							<Button
								variant="link"
								href={app.isMobile ? '' : `/players/${player.player_slug}`}
								class="p-0 text-foreground no-underline hover:text-[var(--player-color)]"
								style="--player-color: {player.color}"
								onclick={(e) => {
									if (app.isMobile && navigateToPlayer) {
										e.preventDefault()
										navigateToPlayer(player.player_slug)
									}
								}}
							>
								{player[key]}
							</Button>
						</TableCell>
					{:else if key === 'currentGame'}
						<TableCell
							class="py-0 data-[active=true]:text-foreground"
							data-active={sortByKey === key}
						>
							<div class="flex flex-col gap-0.5">
								<div>{player[key]}</div>
								{#if player.currentGameDuration}
									<div class="text-xs text-muted-foreground">
										{formatDuration(player.currentGameDuration)}
									</div>
								{/if}
							</div>
						</TableCell>
					{:else}
						<TableCell
							class="py-0 data-[active=true]:text-foreground"
							data-active={sortByKey === key}
						>
							{player[key]}
						</TableCell>
					{/if}
				{/each}
			</TableRow>
		{/each}
	</TableBody>
</Table>
