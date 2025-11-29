<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'
	import type { GameLength } from '$lib/heyapi/aukus/types.gen'

	type ItemType = {
		value: GameLength
		label: string
		highlight?: boolean
	}

	type Props = {
		value?: GameLength
		disabled?: boolean
		gameDuration?: number
		hltbTime?: GameLength
		isInvalid?: boolean
	}

	let {
		value = $bindable(),
		disabled,
		gameDuration,
		hltbTime,
		isInvalid = $bindable()
	}: Props = $props()

	export function getSeconds(hours: number, minutes: number): number {
		const secondsInHour = 3600
		const secondsInMinute = 60
		return hours * secondsInHour + minutes * secondsInMinute
	}

	const hours_4_30 = getSeconds(4, 30) // 4 hours 30 minutes in seconds
	const hours_10_30 = getSeconds(10, 30) // 10 hours 30 minutes in seconds
	const hours_16_30 = getSeconds(16, 30) // 16 hours 30 minutes in seconds
	const hours_24_30 = getSeconds(24, 30) // 24 hours 30 minutes in seconds
	const hours_40_00 = getSeconds(40, 0) // 40 hours in seconds

	const durationMinValues = {
		'0-4': 0,
		'5-10': hours_4_30,
		'11-16': hours_10_30,
		'17-24': hours_16_30,
		'25-40': hours_24_30,
		'40+': hours_40_00
	}

	function getSmallest(duration: number, timeOption: GameLength): GameLength {
		const minTime = durationMinValues[timeOption]
		if (minTime <= duration) {
			return timeOption
		}

		const options: GameLength = ['0-4', '5-10', '11-16', '17-24', '24-40', '40+'].reverse()
		for (const opt of options) {
			const min = durationMinValues[opt]
			if (min < duration) {
				return opt
			}
		}
		return '0-4'
	}

	$effect(() => {
		if (gameDuration && hltbTime) {
			value = getSmallest(gameDuration, hltbTime)
		}
	})

	const items = $derived.by(() => {
		const all: ItemType[] = []
		all.push({ value: '0-4', label: '0 — 4 часов', highlight: false })

		if (gameDuration && gameDuration < hours_4_30) {
			all.push({ value: '5-10', label: '5 — 10 часов', highlight: true })
		} else {
			all.push({ value: '5-10', label: '5 — 10 часов', highlight: false })
		}

		if (gameDuration && gameDuration <= hours_10_30) {
			all.push({ value: '11-16', label: '11 — 16 часов', highlight: true })
		} else {
			all.push({ value: '11-16', label: '11 — 16 часов', highlight: false })
		}

		if (gameDuration && gameDuration <= hours_16_30) {
			all.push({ value: '17-24', label: '17 — 24 часов', highlight: true })
		} else {
			all.push({ value: '17-24', label: '17 — 24 часов', highlight: false })
		}

		if (gameDuration && gameDuration <= hours_24_30) {
			all.push({ value: '25-40', label: '25-39 часов', highlight: true })
		} else {
			all.push({ value: '25-40', label: '25-39 часов', highlight: false })
		}

		if (gameDuration && gameDuration <= hours_40_00) {
			all.push({ value: '40+', label: '40+ часов', highlight: true })
		} else {
			all.push({ value: '40+', label: '40+ часов', highlight: false })
		}

		return all
	})

	const triggerContent = $derived(items.find((f) => f.value === value)?.label ?? 'Итоговое время')

	$effect(() => {
		const selectedItem = items.find((f) => f.value === value)
		isInvalid = selectedItem?.highlight ?? false
	})
</script>

<Select type="single" bind:value {disabled}>
	<SelectTrigger class="w-full">{triggerContent}</SelectTrigger>
	<SelectContent>
		<div class="mb-1 border-b px-2 py-1 text-xs leading-tight text-foreground/90">
			Если игра пройдена быстрее времени<br />
			на HLTB/youtube/steam, считается<br />
			время прохождения стримера.
		</div>
		{#each items as { value, label, highlight } (value)}
			<SelectItem {value} data-highlight={highlight} class="data-[highlight=true]:bg-red-900">
				{label}
			</SelectItem>
		{/each}
	</SelectContent>
</Select>
