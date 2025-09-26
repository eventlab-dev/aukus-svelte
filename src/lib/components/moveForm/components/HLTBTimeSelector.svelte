<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'
	import type { GameLength } from '$lib/heyapi/aukus/types.gen'

	type ItemType = {
		value: GameLength
		label: string
	}

	type Props = {
		value?: GameLength
		disabled?: boolean
	}

	let { value = $bindable(), disabled }: Props = $props()

	const items: ItemType[] = [
		{ value: '0-5', label: '0 — 5 часов' },
		{ value: '5-15', label: '5 — 15 часов' },
		{ value: '15-30', label: '15 — 30 часов' },
		{ value: '30+', label: '30+ часов' }
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
