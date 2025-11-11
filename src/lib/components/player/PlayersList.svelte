<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import PlayerCard from './PlayerCard.svelte'
	import Collapsible from '../collapsible/Collapsible.svelte'
	import CollapsibleTrigger from '../collapsible/CollapsibleTrigger.svelte'
	import CollapsibleContent from '../collapsible/CollapsibleContent.svelte'
	import CollapsibleGroup from '../collapsible/CollapsibleGroup.svelte'

	const { playersInOrder } = getAppManagerContext()

	function currentMskTime() {
		const date = new Date()
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			hour12: false,
			minute: '2-digit',
			timeZone: 'Europe/Moscow'
		})
	}

	let currentTime = $state(currentMskTime())

	$effect(() => {
		const interval = setInterval(() => {
			currentTime = currentMskTime()
		}, 60 * 1000)

		return () => clearInterval(interval)
	})
</script>

{#key $playersInOrder.length}
	<Collapsible collapsed={false} class="w-[260px]">
		<CollapsibleTrigger class="w-full">
			<div>{currentTime} МСК</div>
		</CollapsibleTrigger>
		<CollapsibleContent>
			{#each $playersInOrder as player (player.slug)}
				<CollapsibleGroup>
					<PlayerCard {player} />
				</CollapsibleGroup>
			{/each}
		</CollapsibleContent>
	</Collapsible>
{/key}
