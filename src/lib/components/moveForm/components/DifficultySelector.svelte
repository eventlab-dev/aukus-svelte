<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'
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

	const trigger = $derived(items.find((f) => f.value === value)?.label ?? 'Сложность')
</script>

<Select type="single" {disabled} bind:value>
	<SelectTrigger class="flex-1 overflow-hidden">{trigger}</SelectTrigger>
	<SelectContent>
		{#each items as item (item.value)}
			<SelectItem value={item.value}>{item.label}</SelectItem>
		{/each}
	</SelectContent>
</Select>
