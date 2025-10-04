<script lang="ts">
	import { Canvas } from '@threlte/core'
	import DiceScene from './DiceScene.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { movementStore } = getAppManagerContext()
	const { movementState } = movementStore
</script>

{#if $movementState.state === 'rolling-dice' || $movementState.state === 'dice-results'}
	<div
		class="fixed top-1/2 left-1/2 w-200 -translate-x-1/2 -translate-y-1/2 rounded bg-transparent"
	>
		<Canvas>
			<DiceScene />
		</Canvas>
	</div>
{/if}
