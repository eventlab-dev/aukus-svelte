<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Stage, Layer, type KonvaMouseEvent } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'
	import { Button } from '$lib/components/ui/button'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const { canvasStore, usersStore } = getAppManagerContext()
	const { displayImages, editMode, selectedImage, updateCanvasMutation } = canvasStore
	const { myUser } = usersStore

	const canEdit = $derived(
		Boolean(
			$myUser &&
				($myUser.slug === playerSlug ||
					$myUser.moder_for.includes(playerSlug) ||
					$myUser.role === 'admin')
		)
	)

	const canvasMaxSize = 10000

	let container = $state<HTMLDivElement | null>(null)

	const canvasWidth = $derived(Math.min(container?.offsetWidth ?? window.innerWidth, canvasMaxSize))
	const canvasHeight = $derived(
		Math.min(container?.scrollHeight ?? window.innerHeight, canvasMaxSize)
	)

	function handleStageClick(event: KonvaMouseEvent) {
		if (event.target === event.target.getStage()) {
			selectedImage.set(null)
			// 	setFlipFunction(null)
		}
	}

	function handleSave() {
		canvasStore.saveCanvasChanges()
	}
</script>

<div bind:this={container} class="relative z-0 h-full w-full">
	<div class="absolute z-20 overflow-hidden" style={$editMode ? 'border: 1px solid cyan' : ''}>
		{#if canEdit}
			<div class="flex justify-center gap-3">
				{#if $editMode}
					<Button onclick={() => editMode.set(false)}>Закрыть</Button>
					<Button onclick={handleSave} loading={$updateCanvasMutation.isPending}>Сохранить</Button>
				{:else}
					<Button onclick={() => editMode.set(true)}>Редактировать</Button>
				{/if}
			</div>
		{/if}
		<Stage width={canvasWidth - 2} height={canvasHeight} onclick={handleStageClick}>
			<Layer>
				<!-- <Rect x={100} y={100} width={400} height={200} fill="blue" /> -->
				{#each $displayImages as img (img.id)}
					<CanvasImage file={img} editable={$editMode} />
				{/each}
			</Layer>
		</Stage>
	</div>
</div>
