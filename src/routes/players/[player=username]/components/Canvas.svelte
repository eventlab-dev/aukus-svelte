<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Stage, Layer, type KonvaMouseEvent } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'
	import { Button } from '$lib/components/ui/button'
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const { canvasStore, usersStore } = getAppManagerContext()
	const {
		displayImages,
		editMode,
		selectedImage,
		updateCanvasMutation,
		uploadImageMutation,
		canvasQuery
	} = canvasStore
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

	let fileInput = $state<HTMLInputElement | null>(null)

	function handleUpload(event: Event) {
		const input = event.target as HTMLInputElement
		const file = input?.files?.[0]
		if (!file) return

		if (file.size > 1024 * 1024 * 5) {
			alert('Файл слишком большой. Максимальный размер файла: 5 МБ.')
			return
		}

		const image = new window.Image()
		image.src = URL.createObjectURL(file)
		image.onload = () => {
			$uploadImageMutation.mutate(
				{
					body: {
						file,
						height: image.naturalHeight,
						width: image.naturalWidth
					},
					path: {
						player_slug: playerSlug
					}
				},
				{
					onSettled: () => {
						URL.revokeObjectURL(image.src)
						canvasStore.discardCanvasChanges()
						$canvasQuery.refetch()
					},
					onError: (err) => {
						alert('Ошибка при загрузке изображения: ' + err.detail)
					}
				}
			)
		}
	}

	function handleDelete() {
		if (!$selectedImage) return

		canvasStore.deleteImage($selectedImage.id)
	}

	function handleClose() {
		canvasStore.discardCanvasChanges()
		editMode.set(false)
		$canvasQuery.refetch()
	}

	function handleFlip() {
		if (!$selectedImage) return

		const newImage: CanvasFile = {
			...$selectedImage,
			scaleX: $selectedImage.scaleX * -1
		}
		canvasStore.updateImage(newImage)
	}
</script>

<div
	bind:this={container}
	class="relative h-full w-full"
	style={$editMode ? 'z-index: 100;' : 'z-index: 0;'}
>
	<div class="absolute z-20 overflow-hidden" style={$editMode ? 'border: 1px solid cyan' : ''}>
		{#if canEdit}
			<div class="flex justify-center gap-3">
				{#if $editMode}
					<Button onclick={handleClose} variant="destructive">Закрыть</Button>
					<Button onclick={handleSave} variant="default" loading={$updateCanvasMutation.isPending}>
						Сохранить
					</Button>
					<input
						bind:this={fileInput}
						class="hidden"
						type="file"
						accept=".jpg, .jpeg, .png, .gif, .webp, .svg"
						onchange={handleUpload}
					/>
					<Button
						onclick={() => {
							fileInput?.click()
						}}
						variant="secondary"
					>
						Загрузить изображение
					</Button>
					<Button variant="secondary" onclick={handleFlip}>Отразить</Button>
					<Button
						onclick={handleDelete}
						disabled={!$selectedImage}
						variant="secondary"
						class="ml-5"
					>
						Удалить
					</Button>
				{:else}
					<Button onclick={() => editMode.set(true)}>Редактировать</Button>
				{/if}
			</div>
		{/if}
		<Stage width={canvasWidth - 2} height={canvasHeight} onclick={handleStageClick}>
			<Layer>
				{#each $displayImages as img (img)}
					<CanvasImage file={img} editable={$editMode} />
				{/each}
			</Layer>
		</Stage>
	</div>
</div>
