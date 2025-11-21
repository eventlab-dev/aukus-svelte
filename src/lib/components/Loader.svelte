<script lang="ts">
	import { cn } from '$lib/utils'
	import SnowflakeIcon from './icons/SnowflakeIcon.svelte'

	type Props = {
		class?: string
	}

	const { class: className }: Props = $props()
</script>

<SnowflakeIcon class={cn(className, 'animate-spin-alt')} />
