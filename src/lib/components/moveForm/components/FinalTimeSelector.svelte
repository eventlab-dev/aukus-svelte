<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
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
		hltbTime?: number
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

	function getSmallest(duration1: number, duration2: number): GameLength {
		const minTime = Math.min(duration1, duration2)

		const options: GameLength[] = ['0-4', '5-10', '11-16', '17-24', '25-40', '40+']
		const reversed = options.reverse()

		for (const opt of reversed) {
			const min = durationMinValues[opt]
			// console.log({ opt, min, minTime })
			if (min < minTime) {
				return opt
			}
		}
		return '0-4'
	}

	let recommended = $state<GameLength | null>(null)

	$effect(() => {
		console.log(gameDuration, hltbTime)
		if (gameDuration && hltbTime) {
			recommended = getSmallest(gameDuration, hltbTime)
			value = recommended
		} else {
			value = undefined
			recommended = null
		}
	})

	const items = $derived.by(() => {
		const all: ItemType[] = [
			{ value: '0-4', label: '0 — 4 часов', highlight: false },
			{ value: '5-10', label: '5 — 10 часов', highlight: false },
			{ value: '11-16', label: '11 — 16 часов', highlight: false },
			{ value: '17-24', label: '17 — 24 часов', highlight: false },
			{ value: '25-40', label: '25 — 39 часов', highlight: false },
			{ value: '40+', label: '40+ часов', highlight: false }
		]
		if (recommended) {
			all.forEach((item) => (item.highlight = item.value !== recommended))
		}
		return all
	})

	$effect(() => {
		const selectedItem = items.find((f) => f.value === value)
		isInvalid = selectedItem?.highlight ?? false
	})
</script>

<div class="space-y-1.5">
	<div class="text-center leading-tight">
		Если игра пройдена быстрее времени на HLTB/youtube/steam, считается время прохождения стримера.
	</div>
	<Tabs value={value ?? ''} onValueChange={(v) => (value = v as GameLength)}>
		<TabsList class="flex w-full flex-wrap gap-2">
			{#each items as { value: itemValue, label, highlight } (itemValue)}
				<TabsTrigger
					value={itemValue}
					{disabled}
					class={highlight ? 'data-[highlight=true]:bg-red-900' : ''}
				>
					{label}
				</TabsTrigger>
			{/each}
		</TabsList>
	</Tabs>
</div>
