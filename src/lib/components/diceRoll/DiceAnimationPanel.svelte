<script lang="ts">
	import { Canvas, T } from '@threlte/core'
	import DiceAnimationScene from './DiceAnimationScene.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { LinearSRGBColorSpace, NoToneMapping } from 'three'

	const { turnState } = getAppManagerContext()
</script>

{#if $turnState === 'dice-animation' || $turnState === 'dice-results'}
	<div
		class="fixed top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded bg-gray-500"
	>
		<Canvas toneMapping={NoToneMapping} colorSpace={LinearSRGBColorSpace}>
			<T.Group scale={1.5}>
				<DiceAnimationScene />
			</T.Group>
		</Canvas>
	</div>
{/if}
