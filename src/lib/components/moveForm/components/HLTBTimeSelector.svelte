<script lang="ts">
	import type { ItemLength } from '$lib/api/aukus/types'
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'

	type ItemType = {
		value: ItemLength
		label: string
	}

	type Props = {
		value?: ItemLength
		disabled?: boolean
	}

	let { value = $bindable(), disabled }: Props = $props()

	const items: ItemType[] = [
		{ value: 'tiny', label: '0 — 5 часов' },
		{ value: 'short', label: '5 — 15 часов' },
		{ value: 'medium', label: '15 — 30 часов' },
		{ value: 'long', label: '30+ часов' }
	]

	const triggerContent = $derived(items.find((f) => f.value === value)?.label ?? 'Время по HLTB')
</script>

<Select type="single" bind:value {disabled}>
	<SelectTrigger class="w-full">{triggerContent}</SelectTrigger>
	<SelectContent>
		{#each items as { value, label } (value)}
			<SelectItem {value}>{label}</SelectItem>
		{/each}
	</SelectContent>
</Select>
