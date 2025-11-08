<script lang="ts">
	import { Canvas, T } from '@threlte/core'
	import DiceAnimationScene from './DiceAnimationScene.svelte'
	import { LinearSRGBColorSpace, NoToneMapping } from 'three'
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div class="fixed top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded">
		<Canvas toneMapping={NoToneMapping} colorSpace={LinearSRGBColorSpace}>
			<T.Group scale={1.5}>
				<DiceAnimationScene />
			</T.Group>
		</Canvas>
	</div>
</div>
