<script lang="ts" generics="T">
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
	import ToggleButton from './ToggleButton.svelte'

	type Option<T> = {
		label: string
		value: T
		tooltip?: string
	}

	type Props<T> = {
		options: Option<T>[]
		selectedOption: T
	}

	let { options, selectedOption = $bindable<T>() }: Props<T> = $props()

	function isSelected(value: T): boolean {
		return selectedOption === value
	}

	function setSelected(value: T) {
		const option = options.find((option) => option.value === value)
		if (option) {
			selectedOption = option.value
		}
	}
</script>

<div class="flex gap-2">
	{#each options as option (option.value)}
		<Tooltip>
			<TooltipTrigger>
				<ToggleButton
					bind:selected={() => isSelected(option.value), () => setSelected(option.value)}
				>
					{option.label}
				</ToggleButton>
			</TooltipTrigger>
			{#if option.tooltip}
				<TooltipContent>
					{option.tooltip}
				</TooltipContent>
			{/if}
		</Tooltip>
	{/each}
</div>
