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
		{ value: '0-4', label: '0 — 4 часов' },
		{ value: '5-10', label: '5 — 10 часов' },
		{ value: '11-16', label: '11 — 16 часов' },
		{ value: '17-24', label: '17 — 24 часов' },
		{ value: '25-40', label: '25+ часов' },
		{ value: '40+', label: '40+ часов' }
	]

	const triggerContent = $derived(
		items.find((f) => f.value === value)?.label ?? 'Время (по HLTB или свое)'
	)
</script>

<Select type="single" bind:value {disabled}>
	<SelectTrigger class="w-full">{triggerContent}</SelectTrigger>
	<SelectContent>
		<div class="mb-1 border-b px-2 py-1 text-xs leading-tight text-foreground/90">
			Если игра пройдена быстрее времени<br />
			на HLTB/youtube/steam, считается<br />
			время прохождения стримера.
		</div>
		{#each items as { value, label } (value)}
			<SelectItem {value}>{label}</SelectItem>
		{/each}
	</SelectContent>
</Select>
