<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Stage, Layer, type KonvaMouseEvent } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'
	import { Button } from '$lib/components/ui/button'
	import { type PlayerMoveItem, type CanvasFile } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		playerSlug: string
		contentCenter: number
		contentHeight: number
	}

	const { playerSlug, contentCenter, contentHeight }: Props = $props()

	const { canvasStore, usersStore, playersMovesStore } = getAppManagerContext()
	const {
		displayImages,
		editMode,
		selectedImage,
		updateCanvasMutation,
		uploadImageMutation,
		canvasQuery,
		selectImage
	} = canvasStore
	const { myUser } = usersStore
	const { moves } = playersMovesStore

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
	const canvasHeight = $derived(Math.min(contentHeight, canvasMaxSize))

	function handleStageClick(event: KonvaMouseEvent) {
		if (event.target === event.target.getStage()) {
			selectImage(null)
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
			scale_x: $selectedImage.scale_x * -1
		}
		canvasStore.updateImage(newImage)
	}

	const isAttached = $derived($selectedImage?.attach_move_id !== null)
	const lastMove = $derived<PlayerMoveItem | undefined>($moves[0])

	function handleAttach() {
		if (!$selectedImage || !lastMove) return
		const lastMoveElement = document.getElementById(`move-card-${lastMove.id}`)
		if (!lastMoveElement) return
		const lastMoveY = lastMoveElement.getBoundingClientRect().top

		if ($selectedImage.attach_move_id === null) {
			// attach
			const newImage: CanvasFile = {
				...$selectedImage,
				attach_move_id: lastMove.id,
				y: $selectedImage.y - lastMoveY
			}
			canvasStore.updateImage(newImage)
			return
		} else {
			// detach
			const newImage: CanvasFile = {
				...$selectedImage,
				attach_move_id: null,
				y: $selectedImage.y + lastMoveY
			}
			canvasStore.updateImage(newImage)
			return
		}
	}
</script>

{#if canEdit}
	<div class="sticky top-15 z-200 flex w-full justify-center gap-3">
		{#if $editMode}
			<Button onclick={handleClose} variant="destructive">Закрыть</Button>
			<Button onclick={handleSave} variant="default" loading={$updateCanvasMutation.isPending}>
				Сохранить
			</Button>
			<input
				bind:this={fileInput}
				class="hidden"
				type="file"
				accept=".jpg, .jpeg, .png, .gif, .webp, .svg, .avif"
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
			<Button variant="secondary" onclick={handleFlip} disabled={!$selectedImage}>Отразить</Button>
			<Button variant="secondary" onclick={handleAttach} disabled={!$selectedImage}>
				{!isAttached ? 'Закрепить' : 'Открепить'}
			</Button>
			<Button onclick={handleDelete} disabled={!$selectedImage} variant="secondary" class="ml-5">
				Удалить
			</Button>
		{:else}
			<Button onclick={() => editMode.set(true)}>Редактировать</Button>
		{/if}
	</div>
{/if}

<div
	bind:this={container}
	class="absolute inset-0 min-h-screen"
	style={$editMode ? 'z-index: 100' : 'z-index: 0'}
>
	<div
		class="absolute overflow-hidden"
		style={$editMode ? 'border: 1px solid cyan z-index: 100' : 'z-index: 0'}
	>
		<Stage width={canvasWidth - 2} height={canvasHeight} onclick={handleStageClick}>
			<Layer>
				{#each $displayImages as img (img.id)}
					<CanvasImage file={img} editable={$editMode} centerX={contentCenter} />
				{/each}
			</Layer>
		</Stage>
	</div>
</div>
