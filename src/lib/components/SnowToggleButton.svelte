<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import SnowflakeIcon from './icons/SnowflakeIcon.svelte'
	import { Button } from './ui/button'
	import * as Tooltip from './ui/tooltip'

	const { snowStore } = getAppManagerContext()

	const isActive = $derived(snowStore.snowState.value !== 'off')
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		<Button
			variant="ghost"
			size="icon"
			class="h-[33px] w-[33px] text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground {isActive
				? 'text-primary'
				: ''}"
			onclick={snowStore.cycleSnow}
		>
			<SnowflakeIcon class="h-4 w-4" />
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>{snowStore.snowTooltip}</p>
	</Tooltip.Content>
</Tooltip.Root>
