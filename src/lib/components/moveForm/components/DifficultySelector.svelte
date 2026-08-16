<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import type { Difficulty } from '$lib/types'

	type Props = {
		disabled?: boolean
		value?: Difficulty
	}

	let { disabled, value = $bindable() }: Props = $props()

	type ItemType = {
		value: Difficulty
		label: string
	}

	const items: ItemType[] = [
		{ value: 'easy', label: 'Легкая' },
		{ value: 'normal', label: 'Нормальная / Нет выбора' },
		{ value: 'hard', label: 'Сложная' },
		{ value: 'very-hard', label: 'Очень сложная' }
	]
</script>

<Tabs value={value ?? ''} onValueChange={(v) => (value = v as Difficulty)}>
	<TabsList class="flex w-full flex-wrap gap-2">
		{#each items as item (item.value)}
			<TabsTrigger value={item.value} {disabled} class="flex-1 uppercase">{item.label}</TabsTrigger>
		{/each}
	</TabsList>
</Tabs>
