<script lang="ts">
	import { snowStore, cycleSnow, getSnowTooltip } from '$lib/stores/SnowStore.svelte'
	import SnowflakeIcon from './icons/SnowflakeIcon.svelte'
	import { Button } from './ui/button'
	import * as Tooltip from './ui/tooltip'

	const tooltipText = $derived(getSnowTooltip(snowStore.value))
	const isActive = $derived(snowStore.value !== 'off')
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		<Button
			variant="ghost"
			size="icon"
			class="h-[33px] w-[33px] text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground {isActive ? 'text-primary' : ''}"
			onclick={cycleSnow}
		>
			<SnowflakeIcon class="h-4 w-4" />
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>{tooltipText}</p>
	</Tooltip.Content>
</Tooltip.Root>

