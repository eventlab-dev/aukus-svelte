<script lang="ts">
	import { Canvas } from '@threlte/core'
	import DiceAnimationScene from './DiceAnimationScene.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { turnState } = getAppManagerContext()
</script>

{#if $turnState === 'dice-animation' || $turnState === 'dice-results'}
	<div
		class="fixed top-1/2 left-1/2 w-200 -translate-x-1/2 -translate-y-1/2 rounded bg-transparent"
	>
		<Canvas>
			<DiceAnimationScene />
		</Canvas>
	</div>
{/if}
