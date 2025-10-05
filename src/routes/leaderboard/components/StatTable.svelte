<script lang="ts" generics="T extends { username: string; avatarLink: string }">
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table'
	import type { TableHeaderType } from '$lib/types'

	type Props = {
		data: T[]
		headers: TableHeaderType<T>[]
	}

	const { data, headers }: Props = $props()

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
							<ImageLoader
								src={player.avatarLink}
								alt={player.username}
								class="size-[27px] !rounded-full"
							/>
						</TableCell>
					{:else}
						<TableCell
							class="data-[active=true]:text-foreground data-[bright=true]:text-foreground"
							data-bright={key === 'name'}
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
